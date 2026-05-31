from typing import Any, Dict
import re
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node


def _resolve(value: Any, data: dict) -> Any:
    if isinstance(value, str):
        def replace(match):
            curr: Any = data
            for part in match.group(1).strip().split("."):
                curr = curr.get(part) if isinstance(curr, dict) else None
                if curr is None:
                    return match.group(0)
            return str(curr)
        return re.sub(r"\{\{([^}]+)\}\}", replace, value)
    if isinstance(value, dict):
        return {k: _resolve(v, data) for k, v in value.items()}
    return value


@register_node
class ResendNode(BaseNode):
    node_type = "resend"
    display_name = "Resend Email"
    description = "Send email using Resend"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        try:
            import resend
        except ImportError:
            raise RuntimeError("resend not installed. Run: pip install resend")

        api_key = config.get("resend_api_key") or config.get("api_key")
        from_email = config.get("from")
        to_email = config.get("to")
        subject = config.get("subject") or "Noderift email"
        html = config.get("html") or config.get("body")

        if not api_key:
            raise ValueError("Resend API key is required")
        if not from_email or not to_email or not html:
            raise ValueError("From, to, and email body are required")

        resend.api_key = api_key
        result = resend.Emails.send(_resolve({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html,
        }, inputs.data))
        return NodeOutput(data={"status": "sent", "result": result})
