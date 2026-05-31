import os
from typing import Any, Dict
import httpx
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node


@register_node
class WhatsAppNode(BaseNode):
    node_type = "whatsapp"
    display_name = "WhatsApp"
    description = "Send a WhatsApp text message"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        token = config.get("whatsapp_access_token") or os.environ.get("WHATSAPP_ACCESS_TOKEN")
        phone_number_id = config.get("whatsapp_phone_number_id") or os.environ.get("WHATSAPP_PHONE_NUMBER_ID")
        api_url = config.get("whatsapp_api_url") or os.environ.get("WHATSAPP_API_URL")
        to = config.get("phone") or config.get("to") or inputs.data.get("phone") or inputs.data.get("to")
        message = config.get("message") or inputs.data.get("message")

        if not token:
            raise ValueError("WhatsApp access token is required")
        if not phone_number_id:
            raise ValueError("WhatsApp phone number ID is required")
        if not api_url:
            raise ValueError("WhatsApp API URL is required")
        if not to or not message:
            raise ValueError("Phone number and message are required")

        endpoint = f"{api_url.rstrip('/')}/{phone_number_id}/messages"
        payload = {
            "messaging_product": "whatsapp",
            "to": str(to).replace(" ", "").lstrip("+"),
            "type": "text",
            "text": {"body": str(message)},
        }

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                json=payload,
            )

        try:
            data = response.json()
        except Exception:
            data = {"raw": response.text}

        if response.status_code >= 400:
            raise RuntimeError(f"WhatsApp API error {response.status_code}: {data}")

        return NodeOutput(data={"status": "sent", "response": data})
