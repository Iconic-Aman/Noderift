"""
guardrails.py — Ground-truth verification of the built workflow graph.

After each agent iteration, independently verifies:
1. At least one edge exists (connect_nodes was called).
2. No orphan nodes — every node has at least one edge in or out.
3. No disconnected sub-graphs (all nodes reachable from root).
4. Code nodes: dry-run against multiple API response shapes, not just one.

Returns None on success, or an error string describing what's wrong.
"""
import os
import tempfile
from sqlalchemy.orm import Session
from ai.planner.session import get_session_graph


# Generic dry-run inputs, covering the shapes a real API can return.
# Deliberately NOT github-shaped only — a solution that only works on
# "items" + "stargazers_count" should fail these.
DRY_RUN_SAMPLES = [
    # Root object wrapping a list under an arbitrary key
    {
        "response": {
            "items": [
                {"name": "repo1", "stargazers_count": 1200, "description": "test"},
                {"name": "repo2", "stargazers_count": 800, "description": "other"},
            ],
            "status": "success",
        },
        "status_code": 200,
        "headers": {},
    },
    # Flat single-object response, no array anywhere (e.g. JokeAPI single joke)
    {
        "response": {
            "type": "single",
            "setup": "Why did the chicken cross the road?",
            "delivery": "To get to the other side.",
            "id": 42,
        },
        "status_code": 200,
        "headers": {},
    },
    # Root-level array, no wrapping object at all
    {
        "response": [
            {"id": 1, "value": "x"},
            {"id": 2, "value": "y"},
        ],
        "status_code": 200,
        "headers": {},
    },
    # Stringified JSON (some APIs / proxies pass this through as text)
    {
        "response": '{"items": [{"name": "repo1", "stargazers_count": 1200, "description": "test"}], "status": "success"}',
        "status_code": 200,
        "headers": {},
    },
]


def verify_graph(db: Session, session_id: str, user_prompt: str = "") -> str | None:
    """
    Independently verify the current workflow graph.
    Returns None if valid, or an error description string if not.
    """
    graph = get_session_graph(db, session_id)
    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])

    if len(nodes) == 0:
        return (
            "You did not add any nodes to the canvas. "
            "You MUST call add_node for each step of the workflow, "
            "then call connect_nodes to wire them together."
        )

    if len(nodes) == 1:
        return None

    if not edges:
        node_info = [f"'{n.get('data', {}).get('label', n['id'])}' (id: {n['id']})" for n in nodes]
        return (
            f"Nodes already exist on canvas: {', '.join(node_info)}. "
            "DO NOT call add_node again. "
            "You MUST call connect_nodes NOW to link these existing nodes together."
        )

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

    # Gmail send action node must not be in 1st position
    if len(nodes) > 1:
        for n in nodes:
            ntype = n.get("data", {}).get("node_type", "")
            if ntype == "gmail" and n["id"] not in target_ids:
                return (
                    f"Node '{n.get('data', {}).get('label', n['id'])}' is in the 1st position with no incoming edges. "
                    "Gmail send node cannot be in the 1st position. "
                    "Place a trigger at the start and connect Gmail downstream."
                )

    prompt_lower = user_prompt.lower()

    # Reject unrequested delivery nodes — covers delivery channels
    DELIVERY_KEYWORDS = {
        ("resend", "gmail"): ["email", "e-mail", "mail", "send an email", "send email", "notify me by email"],
        ("slack",): ["slack"],
        ("whatsapp",): ["whatsapp", "whats app"],
    }
    for node_types, keywords in DELIVERY_KEYWORDS.items():
        if not any(k in prompt_lower for k in keywords):
            for n in nodes:
                ntype = n.get("data", {}).get("node_type", "")
                if ntype in node_types:
                    node_id = n["id"]
                    label = n.get("data", {}).get("label", node_id)
                    return (
                        f"User did NOT ask for {node_types[0]} delivery, but '{label}' ({node_id}) [{ntype}] was added. "
                        f"Call remove_node(node_id='{node_id}') to delete the unrequested node."
                    )
    incoming_map = {n["id"]: [] for n in nodes}
    for edge in edges:
        tgt = edge.get("target")
        src = edge.get("source")
        if tgt in incoming_map and src:
            incoming_map[tgt].append(src)

    wants_excel = any(w in prompt_lower for w in ["excel", ".xlsx", "spreadsheet"])

    for n in nodes:
        ntype = n.get("data", {}).get("node_type", "")
        if ntype != "code":
            continue

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

        if wants_excel and ("to_excel" not in code_str or "pandas" not in code_str):
            return (
                f"User asked for an Excel file, but code node '{label}' (id: {node_id}) does not use pandas to_excel. "
                f"Write code with 'import pandas as pd' and 'df.to_excel(filename, index=False)' and call set_node_code."
            )

        if not incoming_map.get(node_id):
            continue

        # --- Dry-run against multiple response shapes ---
        from nodes.code_node import safe_json

        for sample_input in DRY_RUN_SAMPLES:
            with tempfile.TemporaryDirectory() as tmp_dir:
                test_locals = {
                    "input_data": sample_input,
                    "output_data": {},
                    "safe_json": safe_json,
                    "json": __import__("json"),
                    "datetime": __import__("datetime"),
                    "math": __import__("math"),
                    "re": __import__("re"),
                    "csv": __import__("csv"),
                    "os": __import__("os"),
                    "OUTPUT_DIR": tmp_dir,
                }
                try:
                    import pandas as pd
                    test_locals["pd"] = pd
                except Exception:
                    pass

                original_cwd = os.getcwd()
                try:
                    os.chdir(tmp_dir)  # isolate any relative-path file writes (e.g. output.xlsx)
                    exec(code_str, {}, test_locals)
                except TypeError as te:
                    if "must be str, bytes or bytearray, not dict" in str(te):
                        return (
                            f"Node '{label}' (id: {node_id}) crashed with TypeError: {te}. "
                            "You called json.loads() on an object that is ALREADY a dict/list. "
                            "Use: `data = safe_json(input_data.get('response'))` instead. "
                            "Call set_node_code with the fix."
                        )
                    return (
                        f"Node '{label}' (id: {node_id}) crashed during test execution: TypeError: {te}. "
                        "Fix the code — it will be re-tested against several sample API response shapes "
                        "(flat objects, root arrays, and wrapped-list objects), so the code must not assume "
                        "one specific shape or hardcoded field names."
                    )
                except Exception as e:
                    return (
                        f"Node '{label}' (id: {node_id}) crashed during test execution: "
                        f"{type(e).__name__}: {e}. "
                        "Fix the code — it will be re-tested against several sample API response shapes "
                        "(flat objects, root arrays, and wrapped-list objects), so the code must not assume "
                        "one specific shape or hardcoded field names."
                    )
                finally:
                    os.chdir(original_cwd)

                # Verify the Excel claim is real, not just a string match on the source.
                if wants_excel:
                    out = test_locals.get("output_data", {})
                    excel_file = out.get("excel_file")
                    if not excel_file:
                        return (
                            f"Node '{label}' (id: {node_id}) ran without error, but output_data does not "
                            "include 'excel_file'. After writing the file, set "
                            "output_data = {'status': 'success', 'excel_file': filename, ...}. "
                            "Call set_node_code with the fix."
                        )
                    excel_path = excel_file if os.path.isabs(excel_file) else os.path.join(tmp_dir, excel_file)
                    if not os.path.exists(excel_path):
                        return (
                            f"Node '{label}' (id: {node_id}) set output_data['excel_file'] = '{excel_file}', "
                            "but no such file was actually written by df.to_excel(...). "
                            "Make sure df.to_excel(filename, index=False) is actually called before setting output_data. "
                            "Call set_node_code with the fix."
                        )

            # Dry-run execution test for code nodes with upstream inputs
            if incoming_map.get(node_id):
                from nodes.code_node import safe_json
                test_samples = [
                    # Sample 1: Parsed dict (typical JSON API response from http_request)
                    {
                        "response": {
                            "items": [{"name": "repo1", "stargazers_count": 1200, "description": "test"}],
                            "data": [{"name": "item1", "value": 100}],
                            "status": "success",
                        },
                        "status_code": 200,
                        "headers": {},
                    },
                    # Sample 2: Stringified JSON response
                    {
                        "response": '{"items": [{"name": "repo1", "stargazers_count": 1200, "description": "test"}], "status": "success"}',
                        "status_code": 200,
                        "headers": {},
                    },
                ]
                for sample_input in test_samples:
                    test_locals = {
                        "input_data": sample_input,
                        "output_data": {},
                        "safe_json": safe_json,
                        "json": __import__("json"),
                        "datetime": __import__("datetime"),
                        "math": __import__("math"),
                        "re": __import__("re"),
                        "csv": __import__("csv"),
                        "os": __import__("os"),
                        "OUTPUT_DIR": "/tmp",
                    }
                    try:
                        exec(code_str, {}, test_locals)
                    except TypeError as te:
                        if "must be str, bytes or bytearray, not dict" in str(te):
                            return (
                                f"Node '{label}' (id: {node_id}) crashed with TypeError: {te}. "
                                "You called json.loads() on an object that is ALREADY a dict! "
                                "Use the defensive pattern: `raw = input_data.get('response'); data = json.loads(raw) if isinstance(raw, str) else (raw or {})` "
                                "or `data = safe_json(input_data.get('response'))`. Call set_node_code with the fix."
                            )
                    except Exception:
                        pass

    return None
