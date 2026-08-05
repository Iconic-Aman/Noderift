from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node
from services.gmail_service import get_user_gmail_credential, refresh_access_token, fetch_gmail_messages


@register_node
class GmailNode(BaseNode):
    node_type = "gmail_trigger"
    display_name = "Gmail Trigger"
    description = "Fetch emails matching a query from user's Gmail account"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        user_id = config.get("user_id") or inputs.data.get("user_id")
        db = config.get("_db")

        if not user_id or not db:
            raise ValueError("user_id and db session required for GmailNode")

        cred_data = get_user_gmail_credential(db, user_id)
        if not cred_data or "refresh_token" not in cred_data:
            raise ValueError("NEEDS_AUTH:gmail — Gmail account not connected")

        refresh_token = cred_data["refresh_token"]
        access_token = await refresh_access_token(refresh_token)

        query = config.get("query", "")
        max_results = int(config.get("max_results", 10))

        emails = await fetch_gmail_messages(access_token, query=query, max_results=max_results)

        return NodeOutput(data={
            "emails": emails,
            "count": len(emails),
        })
