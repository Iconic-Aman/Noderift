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

        # Use the raw credential the user saved
        cred_data: dict = config.get("_credential") or {}

        # API key — first string value in credential
        api_key = next((v for v in cred_data.values() if isinstance(v, str) and v.strip() and not v.startswith("@") and "@" not in v), None)
        # If all values have @ (email addresses), pick key differently
        if not api_key:
            api_key = cred_data.get("resend_api_key") or cred_data.get("api_key") or cred_data.get("key") or cred_data.get("token")

        if not api_key:
            raise ValueError("Resend API key not found in the attached credential.")

        # From email — node config → credential → free-tier default
        from_email = (
            config.get("from")
            or cred_data.get("from_email")
            or cred_data.get("from")
            or cred_data.get("sender")
            or "onboarding@resend.dev"
        )
        to_email = config.get("to")
        subject = config.get("subject") or "Noderift email"
        html = config.get("html") or config.get("body")

        if not to_email:
            raise ValueError("Missing 'To' email address. Fill it in the node config.")
        if not html:
            raise ValueError("Missing email body. Fill the HTML Body field in the node config.")

        resend.api_key = api_key
        result = resend.Emails.send(_resolve({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html,
        }, inputs.data))
        return NodeOutput(data={"status": "sent", "result": result})
