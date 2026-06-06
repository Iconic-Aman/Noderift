from typing import TypedDict, Annotated, Literal, Optional, List, Dict, Any
from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain.chat_models import init_chat_model
import json
import re
import logging
from core.embeddings import get_embedding
from models.node_vector import NodeEmbedding, WorkflowExampleEmbedding

logger = logging.getLogger("uvicorn")

# 1. State Definition
class ChatbotState(TypedDict):
    messages: Annotated[list, add_messages]
    current_graph: dict
    proposal: Optional[dict]
    validation_error: Optional[str]
    retry_count: int


def _proposal_from_text(text: str):
    # 1. Try to find all markdown JSON blocks
    fenced_blocks = re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced_blocks:
        for block in reversed(fenced_blocks):
            try:
                parsed = json.loads(re.sub(r"(?<!:)\/\/.*", "", block).strip())
                if "proposal" in parsed or "nodes" in parsed:
                    proposal = parsed.get("proposal") if "proposal" in parsed else parsed
                    return proposal
            except Exception:
                continue

    # 2. Try parsing raw JSON objects from the text
    candidates = []
    for match in re.finditer(r"\{", text):
        start = match.start()
        for end in range(len(text), start, -1):
            substring = text[start:end]
            if substring.count("{") == substring.count("}"):
                candidates.append(substring)
                break

    # Parse candidates from last (newest/most specific) to first
    for cand in reversed(candidates):
        try:
            cleaned = re.sub(r"(?<!:)\/\/.*", "", cand).strip()
            parsed = json.loads(cleaned)
            if "proposal" in parsed or "nodes" in parsed:
                proposal = parsed.get("proposal") if "proposal" in parsed else parsed
                return proposal
        except Exception:
            continue

    # Fallback to original parsing method
    raw = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if fenced:
        raw = fenced.group(1)
    elif "{" in raw and "}" in raw:
        raw = raw[raw.find("{"):raw.rfind("}") + 1]
    raw = re.sub(r"(?<!:)\/\/.*", "", raw)
    try:
        parsed = json.loads(raw.strip())
        return parsed.get("proposal") if "proposal" in parsed else parsed
    except Exception:
        return None


# 2. Generate Proposal Node
async def generate_proposal_node(state: ChatbotState, config: RunnableConfig):
    configurable = config.get("configurable", {})
    api_key = configurable.get("api_key")
    base_url = configurable.get("base_url")
    model = configurable.get("model")
    db = configurable.get("db")
    temperature = configurable.get("temperature", 0.7)

    if not api_key or not base_url or not model or not db:
        raise ValueError("Missing api_key, base_url, model, or db in RunnableConfig")

    # Find the last user/human message to perform similarity search
    user_query = ""
    for msg in reversed(state["messages"]):
        if isinstance(msg, HumanMessage) or (isinstance(msg, dict) and msg.get("role") == "user"):
            user_query = msg.content if hasattr(msg, "content") else msg.get("content", "")
            break

    catalog_list = []
    examples_list = []

    if user_query:
        try:
            query_vector = await get_embedding(user_query, input_type="query")
            
            # Query relevant node schemas
            matched_nodes = db.query(NodeEmbedding).order_by(
                NodeEmbedding.embedding.cosine_distance(query_vector)
            ).limit(3).all()
            catalog_list = [node.schema_json for node in matched_nodes]
            
            # Query relevant workflow examples
            matched_examples = db.query(WorkflowExampleEmbedding).order_by(
                WorkflowExampleEmbedding.embedding.cosine_distance(query_vector)
            ).limit(2).all()
            examples_list = [
                {
                    "name": ex.name,
                    "description": ex.description,
                    "workflow_json": ex.workflow_json
                }
                for ex in matched_examples
            ]
        except Exception as e:
            logger.error(f"RAG similarity search failed in LangGraph: {e}")

    catalog = json.dumps(catalog_list, default=str)
    examples = json.dumps(examples_list, default=str) if examples_list else "[]"
    
    system_instruction = (
        "You are an AI assistant that designs and modifies Noderift workflow graphs. "
        "You must output a precise JSON patch containing the changes to be applied to the CURRENT_GRAPH. "
        "Only use nodes listed in NODE_CATALOG. "
        "CRITICAL instructions for modifying workflows:\n"
        "1. To ADD a node: include it in the 'nodes' array with a new unique ID.\n"
        "2. To MODIFY a node: include it in the 'nodes' array with its EXACT existing ID from CURRENT_GRAPH and specify the updated 'config'.\n"
        "3. To DELETE a node: include its exact ID in the 'delete_nodes' array.\n"
        "4. To ADD an edge: include it in the 'edges' array.\n"
        "5. To DELETE an edge: include its source and target IDs in the 'delete_edges' array.\n\n"
        "CRITICAL: When configuring the 'schedule' node, you MUST write a valid 5-field cron expression in standard format: (minute hour day_of_month month day_of_week). "
        "Example: 'every monday 10:44 AM' must be '44 10 * * 1' or '44 10 * * MON'. "
        "Return strict JSON format:\n"
        "{\n"
        "  \"message\": \"Explanation of changes...\",\n"
        "  \"proposal\": {\n"
        "    \"nodes\": [{\"id\": \"node-id\", \"type\": \"type\", \"config\": {}}],\n"
        "    \"edges\": [{\"source\": \"source-id\", \"target\": \"target-id\"}],\n"
        "    \"delete_nodes\": [\"node-id-to-delete\"],\n"
        "    \"delete_edges\": [{\"source\": \"source-id\", \"target\": \"target-id\"}]\n"
        "  }\n"
        "}\n\n"
        f"NODE_CATALOG: {catalog}. \n"
        f"WORKFLOW_EXAMPLES: {examples}. \n"
        f"CURRENT_GRAPH: {json.dumps(state['current_graph'], default=str)}"
    )

    validation_error = state.get("validation_error")
    if validation_error:
        system_instruction += (
            f"\n\n[WARNING] Previous generation failed validation:\n"
            f"Error: {validation_error}\n"
            f"Please regenerate proposal and resolve this error."
        )

    # Initialize LangChain LLM
    llm = init_chat_model(
        model=model,
        model_provider="openai",
        openai_api_key=api_key,
        openai_api_base=base_url,
        temperature=temperature,
    )

    # Map message history to LangChain Message objects
    lc_messages = []
    for msg in state["messages"]:
        if isinstance(msg, BaseMessage):
            lc_messages.append(msg)
        elif isinstance(msg, dict):
            role = msg.get("role")
            content = msg.get("content", "")
            if role == "user":
                lc_messages.append(HumanMessage(content=content))
            elif role == "system":
                lc_messages.append(SystemMessage(content=content))
            else:
                lc_messages.append(SystemMessage(content=content)) # Fallback

    messages = [SystemMessage(content=system_instruction)] + lc_messages
    response = await llm.ainvoke(messages)
    
    proposal = _proposal_from_text(response.content)

    return {
        "messages": [response],
        "proposal": proposal,
        "retry_count": state.get("retry_count", 0) + 1
    }


# 3. Validate Proposal Node
def validate_proposal_node(state: ChatbotState):
    proposal = state.get("proposal")
    if not proposal:
        return {"validation_error": "LLM failed to output proposal JSON"}

    nodes = proposal.get("nodes", [])
    edges = proposal.get("edges", [])

    if not isinstance(nodes, list) or not isinstance(edges, list):
        return {"validation_error": "proposal JSON must contain 'nodes' and 'edges' lists"}

    # Get existing node IDs from current graph, excluding any nodes requested to be deleted
    current_nodes = state.get("current_graph", {}).get("nodes", [])
    delete_nodes = set(proposal.get("delete_nodes", []))
    
    node_ids = {n.get("id") for n in current_nodes if n.get("id") not in delete_nodes}
    
    # Add newly proposed or modified node IDs
    for node in nodes:
        if isinstance(node, dict) and node.get("id"):
            node_ids.add(node.get("id"))

    invalid_edges = []
    for edge in edges:
        if not isinstance(edge, dict):
            invalid_edges.append(f"Invalid edge format: {edge}")
            continue
        source = edge.get("source")
        target = edge.get("target")
        if source not in node_ids or target not in node_ids:
            invalid_edges.append(f"Edge source/target connects to non-existent node: {source} -> {target}")

    if invalid_edges:
        return {"validation_error": f"Edge validation failed: {', '.join(invalid_edges)}"}

    return {"validation_error": None}


# 4. Routing logic
def route_path(state: ChatbotState) -> Literal["generate_proposal_node", "__end__"]:
    if state.get("validation_error") and state.get("retry_count", 0) < 3:
        logger.info(f"LangGraph self-correction triggered (retry {state.get('retry_count')}) due to error: {state.get('validation_error')}")
        return "generate_proposal_node"
    return END


# 5. Build Graph
graph_builder = StateGraph(ChatbotState)
graph_builder.add_node("generate_proposal_node", generate_proposal_node)
graph_builder.add_node("validate_proposal_node", validate_proposal_node)

graph_builder.add_edge(START, "generate_proposal_node")
graph_builder.add_edge("generate_proposal_node", "validate_proposal_node")
graph_builder.add_conditional_edges("validate_proposal_node", route_path)

memory = MemorySaver()
graph = graph_builder.compile(checkpointer=memory)
