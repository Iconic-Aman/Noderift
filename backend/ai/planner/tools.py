import uuid
import json
from typing import Dict, Any, List
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from nodes import NODE_REGISTRY
from ai.planner.session import get_session_graph, patch_graph

@tool
def get_available_nodes() -> List[dict]:
    """
    Returns all node types registered in Noderift.
    Use this first to know what nodes you can add.
    """
    schemas = {
        "schedule": {"triggered_at": "string", "cron": "string", "timezone": "string"},
        "webhook": {"body": "object", "headers": "object", "query": "object"},
        "http_request": {"status_code": "number", "headers": "object", "response": "object/any"},
        "code": {"_logs": "string", "...": "dynamic keys defined by output_data in user script"},
        "resend": {"status": "string", "result": "object"},
        "whatsapp": {"status": "string", "response": "object"},
        "ai_agent": {"text": "string", "raw": "object"},
        "filter": {"...": "passes upstream variables if condition is true"},
        "merge": {"merged": "object"},
        "loop": {"items": "array", "count": "number"},
        "set_variable": {"...": "stores custom variables key/value in state"},
        "playwright": {"url": "string", "title": "string", "...": "dynamic keys defined by output_data in script"},
        "composio": {"result": "object"},
        "database": {"results": "array (for select/find)", "row_count": "number", "status": "string"},
        "gmail_trigger": {"emails": "array [{id,subject,from,date,snippet,body}]", "count": "number"},
    }
    return [
        {
            "type": node_type,
            "display_name": node_cls.display_name,
            "description": node_cls.description,
            "expected_output_keys": schemas.get(node_type, {})
        }
        for node_type, node_cls in NODE_REGISTRY.items()
    ]

@tool
def get_current_graph(config: RunnableConfig) -> dict:
    """
    Returns the current nodes and edges on the canvas.
    Call this before making edits to understand what already exists.
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"nodes": [], "edges": []}
    return get_session_graph(db, session_id)

@tool
async def add_node(node_type: str, label: str, node_config: Any, config: RunnableConfig) -> dict:
    """
    Add a node to the canvas.
    Returns the node_id — save it to use in connect_nodes later.

    Args:
        node_type: Must be a valid type from get_available_nodes()
        label: Human-readable name shown on the canvas
        node_config: Node-specific configuration as a JSON string, e.g. '{"url": "https://...", "method": "GET"}'
    """
    try:
        parsed_config = json.loads(node_config) if isinstance(node_config, str) else node_config
    except Exception:
        parsed_config = {}
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    # Validate node type exists
    if node_type not in NODE_REGISTRY:
        return {"error": f"Invalid node type: {node_type}. Call get_available_nodes to check valid types."}

    # Map backend node type to frontend ID prefix
    prefix_map = {
        "http_request": "http",
        "schedule": "schedule",
        "webhook": "webhook",
        "code": "code",
        "playwright": "playwright",
        "composio": "composio",
        "whatsapp": "whatsapp",
        "resend": "resend",
        "ai_agent": "ai_agent",
        "filter": "filter",
        "merge": "merge",
        "loop": "loop",
        "set_variable": "set_variable",
        "database": "database",
    }
    id_prefix = prefix_map.get(node_type, node_type)
    node_id = f"{id_prefix}-{uuid.uuid4().hex[:8]}"
    
    current_graph = get_session_graph(db, session_id)
    node_count = len(current_graph.get("nodes", []))

    TRIGGER_TYPES = {"schedule", "webhook", "gmail_trigger"}
    if node_type in TRIGGER_TYPES and node_count > 0:
        # Shift all existing nodes right to make room for trigger at front
        for existing in current_graph.get("nodes", []):
            existing["position"]["x"] = existing["position"].get("x", 100) + 250
            await patch_graph(db, session_id, "update_node", {"id": existing["id"], "position": existing["position"]})
        position = {"x": 100, "y": 150}
    else:
        position = {"x": 100 + node_count * 250, "y": 150}

    node_payload = {
        "id": node_id,
        "type": "workflowNode",
        "data": {"label": label, "node_type": node_type, "config": parsed_config},
        "position": position,
    }

    await patch_graph(db, session_id, "add_node", node_payload)
    from ai.planner.session import emit_canvas_patch
    await emit_canvas_patch(session_id, "agent_step", {"text": f"Added node: {label} ({node_type})"})
    return {"node_id": node_id, "status": "added"}

@tool
async def connect_nodes(source_id: str, target_id: str, config: RunnableConfig) -> dict:
    """
    Connect two nodes with a directed edge.
    Data flows from source → target.
    Always call this after adding nodes to wire dependencies.

    Args:
        source_id: node_id of the upstream node (produces output)
        target_id: node_id of the downstream node (consumes input)
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    edge_id = f"edge_{source_id}_{target_id}"
    edge_payload = {"id": edge_id, "source": source_id, "target": target_id}

    await patch_graph(db, session_id, "add_edge", edge_payload)
    from ai.planner.session import emit_canvas_patch
    await emit_canvas_patch(session_id, "agent_step", {"text": f"Connected nodes: {source_id} ➔ {target_id}"})
    return {"edge_id": edge_id, "status": "connected"}

@tool
async def update_node_config(node_id: str, node_config: Any, config: RunnableConfig) -> dict:
    """
    Update the configuration of an existing node.
    Use this when the user asks to change a node's settings.

    Args:
        node_id: ID of the node to update
        node_config: Partial or full config as a JSON string, e.g. '{"method": "POST"}'
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    try:
        parsed_config = json.loads(node_config) if isinstance(node_config, str) else node_config
    except Exception:
        parsed_config = {}

    payload = {"id": node_id, "config": parsed_config}
    await patch_graph(db, session_id, "update_node", payload)
    from ai.planner.session import emit_canvas_patch
    await emit_canvas_patch(session_id, "agent_step", {"text": f"Configured node {node_id}"})
    return {"node_id": node_id, "status": "updated"}

@tool
async def remove_node(node_id: str, config: RunnableConfig) -> dict:
    """
    Remove a node and all its connected edges from the canvas.
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    payload = {"id": node_id}
    await patch_graph(db, session_id, "remove_node", payload)
    return {"node_id": node_id, "status": "removed"}

@tool
async def clear_canvas(config: RunnableConfig) -> dict:
    """
    Remove all nodes and edges. Use only when user explicitly asks to start over.
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    await patch_graph(db, session_id, "clear", {})
    return {"status": "cleared"}

@tool
async def test_node_execution(node_type: str, node_config: Any, inputs: Any = "{}") -> dict:
    """
    Execute/test a node with config and optional mock inputs.
    Use this at design-time to verify an API response or see the structure of a node's output.

    Args:
        node_type: The type of node (e.g. 'http_request', 'code')
        node_config: The config JSON string for the node
        inputs: Mock input data JSON string (optional, defaults to '{}')
    """
    from nodes import get_node_class, NodeInput
    import json
    
    try:
        parsed_config = json.loads(node_config) if isinstance(node_config, str) else node_config
    except Exception:
        parsed_config = {}

    try:
        parsed_inputs = json.loads(inputs) if isinstance(inputs, str) else inputs
    except Exception:
        parsed_inputs = {}

    try:
        node_cls = get_node_class(node_type)
        node_instance = node_cls()
        result = await node_instance.execute(NodeInput(data=parsed_inputs), parsed_config)
        return {"status": "success", "output": result.data}
    except Exception as e:
        return {"status": "error", "error": str(e)}
