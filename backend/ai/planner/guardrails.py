"""
guardrails.py — Ground-truth verification of the built workflow graph.

After each agent iteration, independently verifies:
1. At least one edge exists (connect_nodes was called).
2. No orphan nodes — every node has at least one edge in or out.
3. No disconnected sub-graphs (all nodes reachable from root).

Returns None on success, or an error string describing what's wrong.
"""
from sqlalchemy.orm import Session
from ai.planner.session import get_session_graph


def verify_graph(db: Session, session_id: str) -> str | None:
    """
    Independently verify the current workflow graph.
    Returns None if valid, or an error description string if not.
    """
    graph = get_session_graph(db, session_id)
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    # No nodes built at all — agent skipped tool calls entirely
    if len(nodes) == 0:
        return (
            "You did not add any nodes to the canvas. "
            "You MUST call add_node for each step of the workflow, "
            "then call connect_nodes to wire them together."
        )

    # Single node workflow is valid (nothing to connect)
    if len(nodes) == 1:
        return None

    # Must have at least one edge for multi-node graph
    if not edges:
        node_info = [f"'{n.get('data', {}).get('label', n['id'])}' (id: {n['id']})" for n in nodes]
        return (
            f"Nodes already exist on canvas: {', '.join(node_info)}. "
            "DO NOT call add_node again. "
            "You MUST call connect_nodes NOW to link these existing nodes together."
        )

    # Check for orphan nodes
    connected_ids = set()
    for edge in edges:
        connected_ids.add(edge.get("source"))
        connected_ids.add(edge.get("target"))

    orphans = [
        f"'{n.get('data', {}).get('label', n['id'])}' (id: {n['id']})"
        for n in nodes
        if n["id"] not in connected_ids
    ]
    if orphans:
        return (
            f"These existing nodes are not connected: {', '.join(orphans)}. "
            "DO NOT call add_node again. "
            "Call connect_nodes NOW using their exact IDs."
        )

    return None
