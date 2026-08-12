import sys
import io
import os
import traceback
from pathlib import Path
from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node

# All code-node output files land here so the download route can find them.
OUTPUT_DIR = Path(os.environ.get("NODERIFT_OUTPUT_DIR", "/tmp/noderift_outputs"))
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

@register_node
class CodeNode(BaseNode):
    node_type = "code"
    display_name = "Code"
    description = "Execute custom Python code"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        code_str = config.get("code", "").strip()
        if not code_str:
            code_str = "output_data = {'status': 'processed', 'input': input_data}"

        # Prepare context
        local_vars = {
            "input_data": inputs.data,
            "output_data": {},
            # Provide standard modules for convenience
            "json": __import__("json"),
            "datetime": __import__("datetime"),
            "math": __import__("math"),
            "re": __import__("re"),
            "csv": __import__("csv"),
            "os": __import__("os"),
            # Expose output dir so user code can write files to the right place
            "OUTPUT_DIR": str(OUTPUT_DIR),
        }

        # Capture print outputs
        stdout_capture = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = stdout_capture

        # Run user code from within the output directory so relative paths resolve correctly
        old_cwd = os.getcwd()
        os.chdir(OUTPUT_DIR)
        files_before = set(os.listdir("."))
        try:
            exec(code_str, {}, local_vars)
        except Exception:
            error_msg = traceback.format_exc()
            raise RuntimeError(f"Code Node Execution failed:\n{error_msg}")
        finally:
            files_after = set(os.listdir("."))
            sys.stdout = old_stdout
            os.chdir(old_cwd)

        output = local_vars.get("output_data", {})
        if not isinstance(output, dict):
            output = {"result": output}

        # Track newly created files (e.g. excel, csv, etc.)
        new_files = list(files_after - files_before)
        if new_files:
            output["_generated_files"] = new_files

        # Attach captured prints to logs
        printed_logs = stdout_capture.getvalue()
        if printed_logs:
            output["_logs"] = printed_logs

        return NodeOutput(data=output)
