
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

CRITICAL: You may ONLY use these exact node types when calling add_node. Do NOT invent or use any other node types.
Allowed node types:
- schedule: Trigger workflow on a cron schedule. Config: {cron, timezone}
- webhook: Trigger workflow via HTTP webhook. Config: {method}
- http_request: Make an HTTP request. Config: {url, method, headers, body}
- code: Execute custom Python code. Config: {code}
- resend: Send an email via Resend. Config: {from, to, subject, html}
- whatsapp: Send a WhatsApp message. Config: {to, message}
- ai_agent: Run an AI agent. Config: {prompt, model}
- filter: Filter data based on a condition. Config: {condition}
- merge: Merge outputs from multiple nodes. Config: {}
- loop: Loop over an array. Config: {array_key}
- set_variable: Set a variable. Config: {key, value}
- playwright: Run browser automation. Config: {script}
- composio: Use a Composio action. Config: {action, params}

Rules:
1. You may ONLY call the registered canvas tools. Do NOT use tools like brave_search, search, or web_search.
2. Always call get_current_graph() before editing an existing workflow.
3. After adding nodes, ALWAYS call connect_nodes() using the exact node_id returned by add_node. Never guess IDs.
4. When the user asks to modify or remove something, read the graph first to find the right node_id.
5. Be concise in your final reply.
"""

def get_planner_agent(api_key: str, base_url: str, model_name: str, temperature: float = 0.2):
    """Factory to create a ReAct planner agent using Groq."""
    from langchain_groq import ChatGroq
    from core.config import settings

    print(f"AI Planner loading Groq Model: {settings.GROQ_MODEL}")

    llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
        temperature=temperature,
        model_kwargs={"parallel_tool_calls": False},
    )



    tools = [
        get_available_nodes,
        get_current_graph,
        add_node,
        connect_nodes,
        update_node_config,
        remove_node,
        clear_canvas,
    ]
    # Bind tools explicitly to enforce structured tool call format
    llm_with_tools = llm.bind_tools(tools)
    return create_react_agent(
        model=llm_with_tools,
        tools=tools,
        state_modifier=SYSTEM_PROMPT,
    )

