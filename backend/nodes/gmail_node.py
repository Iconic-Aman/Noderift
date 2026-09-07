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

        raw_query = config.get("query") or config.get("sender_email") or config.get("email") or ""
        raw_query = raw_query.strip()
        if raw_query and ":" not in raw_query and "@" in raw_query:
            query = f"from:{raw_query}"
        else:
            query = raw_query

        max_results = int(config.get("max_results", 10))

        emails = await fetch_gmail_messages(access_token, query=query, max_results=max_results)

        return NodeOutput(data={
            "emails": emails,
            "count": len(emails),
        })


from services.gmail_service import send_gmail_message


@register_node
class GmailSendNode(BaseNode):
    node_type = "gmail"
    display_name = "Gmail"
    description = "Send email via Gmail with attachments (Excel, CSV, files)"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        user_id = config.get("user_id") or inputs.data.get("user_id")
        db = config.get("_db")

        if not user_id or not db:
            raise ValueError("user_id and db session required for GmailSendNode")

        cred_data = get_user_gmail_credential(db, user_id)
        if not cred_data or "refresh_token" not in cred_data:
            raise ValueError("NEEDS_AUTH:gmail — Gmail account not connected")

        refresh_token = cred_data["refresh_token"]
        access_token = await refresh_access_token(refresh_token)

        to_email = config.get("to") or config.get("recipient")
        if not to_email:
            raise ValueError("Missing 'To' email address in Gmail node config")

        subject = config.get("subject") or "Noderift Workflow Notification"
        body = config.get("body") or config.get("html") or config.get("message") or ""

        # Collect attachments from config
        attachments_to_send = []
        raw_attachment = config.get("attachment") or config.get("attachments") or config.get("file") or config.get("file_path")
        if raw_attachment:
            if isinstance(raw_attachment, list):
                attachments_to_send.extend(raw_attachment)
            elif isinstance(raw_attachment, str):
                for item in raw_attachment.split(","):
                    if item.strip():
                        attachments_to_send.append(item.strip())

        # Auto-detect attachments from upstream node outputs if not explicitly configured
        if not attachments_to_send:
            for key in ["excel_file", "file", "file_path", "filename", "filepath", "csv_file", "report_file"]:
                val = inputs.data.get(key)
                if val and isinstance(val, str) and val.strip() and val.strip() not in attachments_to_send:
                    attachments_to_send.append(val.strip())

            gen_files = inputs.data.get("_generated_files")
            if gen_files and isinstance(gen_files, list):
                for f in gen_files:
                    if f and str(f).strip() and str(f).strip() not in attachments_to_send:
                        attachments_to_send.append(str(f).strip())

            upstream = inputs.data.get("_upstream", {})
            if isinstance(upstream, dict):
                for up_id, up_data in upstream.items():
                    if isinstance(up_data, dict):
                        for key in ["excel_file", "file", "file_path", "filename", "csv_file"]:
                            val = up_data.get(key)
                            if val and isinstance(val, str) and val.strip() and val.strip() not in attachments_to_send:
                                attachments_to_send.append(val.strip())
                        gen = up_data.get("_generated_files")
                        if gen and isinstance(gen, list):
                            for f in gen:
                                if f and str(f).strip() and str(f).strip() not in attachments_to_send:
                                    attachments_to_send.append(str(f).strip())

        # If body is empty, provide a clean default
        if not body:
            if attachments_to_send:
                body = f"Please find attached: {', '.join(attachments_to_send)}\n\nSent from Noderift workflow."
            else:
                body = "Automated notification from Noderift workflow."

        result = await send_gmail_message(
            access_token=access_token,
            to=to_email,
            subject=subject,
            body=body,
            attachments=attachments_to_send,
        )

        return NodeOutput(data={
            "status": "sent",
            "message_id": result.get("id"),
            "thread_id": result.get("threadId"),
            "to": to_email,
            "subject": subject,
            "attachments_sent": result.get("attachments", attachments_to_send),
        })

