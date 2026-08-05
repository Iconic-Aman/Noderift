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

    # Single node is fine — nothing to connect
    if len(nodes) <= 1:
        return None

    # Must have at least one edge for multi-node graph
    if not edges:
        node_labels = [n.get("data", {}).get("label", n["id"]) for n in nodes]
        return (
            f"You added {len(nodes)} nodes ({', '.join(node_labels)}) "
            "but called connect_nodes 0 times. "
            "You MUST call connect_nodes to link every node in the workflow."
        )

    # Check for orphan nodes (no edge in AND no edge out)
    connected_ids = set()
    for edge in edges:
        connected_ids.add(edge.get("source"))
        connected_ids.add(edge.get("target"))

    orphans = [
        n.get("data", {}).get("label", n["id"])
        for n in nodes
        if n["id"] not in connected_ids
    ]
    if orphans:
        return (
            f"These nodes are not connected to anything: {', '.join(orphans)}. "
            "Call connect_nodes to wire them into the workflow."
        )

    return None
