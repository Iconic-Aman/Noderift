from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node
from services.slack_service import get_user_slack_credential, send_slack_message


@register_node
class SlackNode(BaseNode):
    node_type = "slack"
    display_name = "Slack"
    description = "Send a message to a Slack channel"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        user_id = config.get("user_id") or inputs.data.get("user_id")
        db = config.get("_db")
        credential_id = config.get("credential_id")

        if not user_id or not db:
            raise ValueError("user_id and db session required for SlackNode")

        cred_data = get_user_slack_credential(db, user_id, credential_id=credential_id)
        if not cred_data or not cred_data.get("access_token"):
            raise ValueError("NEEDS_AUTH:slack — Slack account not connected")

        access_token = cred_data["access_token"]

        channel = config.get("channel") or inputs.data.get("channel") or ""
        message = config.get("message") or inputs.data.get("message") or ""

        if not channel:
            raise ValueError("Slack channel is required")
        if not message:
            raise ValueError("Slack message is required")

        result = await send_slack_message(
            access_token=access_token,
            channel=str(channel),
            message=str(message),
        )

        return NodeOutput(data={
            "status": "sent",
            "channel": result.get("channel"),
            "ts": result.get("ts"),
            "message": message,
        })
