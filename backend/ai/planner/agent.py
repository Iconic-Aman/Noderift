
from langgraph.prebuilt import create_react_agent
from ai.planner.tools import (
    get_available_nodes,
    get_current_graph,
    add_node,
    connect_nodes,
    update_node_config,
    remove_node,
    clear_canvas,
)

SYSTEM_PROMPT = """You are Noderift's AI Planner. Your job is to build and modify workflow automation pipelines on a visual canvas by calling tools.

Rules:
1. Always call get_available_nodes() first to know what node types exist.
2. Always call get_current_graph() before editing an existing workflow.
3. After adding nodes, ALWAYS call connect_nodes() to wire dependencies. Data flows from source to target node. Never leave nodes disconnected unless the user asks.
4. Use the node_id returned from add_node immediately in connect_nodes.
5. When the user asks to modify or remove something, read the graph first, find the right node_id, then call the appropriate tool.
6. Be concise in your final reply. Tell the user what you built or modified, not how you did it.
"""

def get_planner_agent(api_key: str, base_url: str, model_name: str, temperature: float = 0.2):
    """Factory to create a ReAct planner agent using Groq."""
    from langchain_groq import ChatGroq
    from core.config import settings

    llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
    )
    
    # Disable parallel tool calls
    if hasattr(llm, "bind_tools"):
        original_bind = llm.bind_tools
        def patched_bind(tools, **kwargs):
            kwargs["parallel_tool_calls"] = False
            return original_bind(tools, **kwargs)
        object.__setattr__(llm, "bind_tools", patched_bind)



    tools = [
        get_available_nodes,
        get_current_graph,
        add_node,
        connect_nodes,
        update_node_config,
        remove_node,
        clear_canvas,
    ]
    return create_react_agent(
        model=llm,
        tools=tools,
        state_modifier=SYSTEM_PROMPT,
    )
