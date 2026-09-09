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

        # Check for attachments
        attachments_to_send = []
        raw_att = config.get("attachment") or config.get("attachments") or config.get("file") or config.get("file_path")
        if raw_att:
            if isinstance(raw_att, list):
                attachments_to_send.extend(raw_att)
            elif isinstance(raw_att, str):
                for item in raw_att.split(","):
                    if item.strip():
                        attachments_to_send.append(item.strip())

        if not attachments_to_send:
            for key in ["excel_file", "file", "file_path", "filename", "csv_file"]:
                val = inputs.data.get(key)
                if val and isinstance(val, str) and val.strip():
                    attachments_to_send.append(val.strip())

        resend_attachments = []
        if attachments_to_send:
            from services.gmail_service import resolve_attachment_path
            for att in attachments_to_send:
                p = resolve_attachment_path(str(att))
                if p and p.exists():
                    with open(p, "rb") as f:
                        resend_attachments.append({
                            "filename": p.name,
                            "content": list(f.read()),
                        })

        email_payload = _resolve({
            "from": from_email,
            "to": to_email,
            "subject": subject,
            "html": html,
        }, inputs.data)

        if resend_attachments:
            email_payload["attachments"] = resend_attachments

        resend.api_key = api_key
        result = resend.Emails.send(email_payload)
        return NodeOutput(data={"status": "sent", "result": result, "attachments_sent": [a["filename"] for a in resend_attachments]})
