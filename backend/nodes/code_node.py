import sys
import io
import traceback
from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node

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
        }

        # Capture print outputs
        stdout_capture = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = stdout_capture

        try:
            # Execute the code
            exec(code_str, {}, local_vars)
        except Exception as e:
            error_msg = traceback.format_exc()
            raise RuntimeError(f"Code Node Execution failed:\n{error_msg}")
        finally:
            sys.stdout = old_stdout

        output = local_vars.get("output_data", {})
        if not isinstance(output, dict):
            output = {"result": output}

        # Attach captured prints to logs
        printed_logs = stdout_capture.getvalue()
        if printed_logs:
            output["_logs"] = printed_logs

        return NodeOutput(data=output)
