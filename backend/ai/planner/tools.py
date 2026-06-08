import uuid
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
    return [
        {
            "type": node_type,
            "display_name": node_cls.display_name,
            "description": node_cls.description,
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
async def add_node(node_type: str, label: str, node_config: dict, config: RunnableConfig) -> dict:
    """
    Add a node to the canvas.
    Returns the node_id — save it to use in connect_nodes later.

    Args:
        node_type: Must be a valid type from get_available_nodes()
        label: Human-readable name shown on the canvas
        node_config: Node-specific configuration (url, script, channel etc.)
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    # Validate node type exists
    if node_type not in NODE_REGISTRY:
        return {"error": f"Invalid node type: {node_type}. Call get_available_nodes to check valid types."}

    node_id = f"node_{uuid.uuid4().hex[:8]}"
    current_graph = get_session_graph(db, session_id)
    node_count = len(current_graph.get("nodes", []))
    
    # Generate auto layout position
    position = {"x": 100 + node_count * 250, "y": 150}

    node_payload = {
        "id": node_id,
        "type": node_type,
        "data": {"label": label, "config": node_config},
        "position": position,
    }

    await patch_graph(db, session_id, "add_node", node_payload)
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
    return {"edge_id": edge_id, "status": "connected"}

@tool
async def update_node_config(node_id: str, node_config: dict, config: RunnableConfig) -> dict:
    """
    Update the configuration of an existing node.
    Use this when the user asks to change a node's settings.

    Args:
        node_id: ID of the node to update
        node_config: Partial or full config dict to merge into existing config
    """
    db = config.get("configurable", {}).get("db")
    session_id = config.get("configurable", {}).get("session_id")
    if not db or not session_id:
        return {"error": "No db session or session_id in config"}

    payload = {"id": node_id, "config": node_config}
    await patch_graph(db, session_id, "update_node", payload)
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
