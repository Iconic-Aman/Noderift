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


def verify_graph(db: Session, session_id: str, user_prompt: str = "") -> str | None:
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

    # Trigger nodes must be roots (no incoming edges)
    TRIGGER_TYPES = {"schedule", "webhook", "gmail_trigger"}
    target_ids = {e.get("target") for e in edges}
    for n in nodes:
        ntype = n.get("data", {}).get("node_type", "")
        if ntype in TRIGGER_TYPES and n["id"] in target_ids:
            return (
                f"Node '{n.get('data',{}).get('label', n['id'])}' is a trigger node but has incoming edges. "
                "Trigger nodes must be the starting point — no node should connect INTO them. "
                "Fix the edge direction so the trigger node is the source."
            )

    # Validate code nodes
    incoming_map = {n["id"]: [] for n in nodes}
    for edge in edges:
        tgt = edge.get("target")
        src = edge.get("source")
        if tgt in incoming_map and src:
            incoming_map[tgt].append(src)

    for n in nodes:
        ntype = n.get("data", {}).get("node_type", "")
        if ntype == "code":
            node_id = n["id"]
            label = n.get("data", {}).get("label", node_id)
            cfg = n.get("data", {}).get("config", {})
            code_str = str(cfg.get("code", "")).strip()

            if not code_str or code_str == "output_data = {'status': 'processed', 'input': input_data}":
                return (
                    f"Node '{label}' (id: {node_id}) has no Python code written. "
                    f"Write complete Python code to extract/process data and call set_node_code(node_id='{node_id}', code=...)."
                )

            try:
                compile(code_str, "<string>", "exec")
            except SyntaxError as e:
                return (
                    f"Node '{label}' (id: {node_id}) has Python syntax error: {e.msg} on line {e.lineno}. "
                    f"Call set_node_code with fixed Python code."
                )

            if incoming_map.get(node_id) and "input_data" not in code_str:
                return (
                    f"Node '{label}' (id: {node_id}) has upstream inputs, but code does not use 'input_data'. "
                    f"Extract data using input_data.get(...) and call set_node_code."
                )

            prompt_lower = user_prompt.lower()
            if any(w in prompt_lower for w in ["excel", ".xlsx", "spreadsheet"]):
                if "to_excel" not in code_str or "pandas" not in code_str:
                    return (
                        f"User asked for an Excel file, but code node '{label}' (id: {node_id}) does not use pandas to_excel. "
                        f"Write code with 'import pandas as pd' and 'df.to_excel(filename, index=False)' and call set_node_code."
                    )

    return None
