import httpx
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import json
from models.credential import Credential
from core.config import settings


async def refresh_access_token(refresh_token: str) -> str:
    """Exchange a Google OAuth refresh token for a fresh access token."""
    async with httpx.AsyncClient() as client:
        res = await client.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
        )
    if res.status_code != 200:
        raise ValueError(f"Failed to refresh Google access token: {res.text}")
    token_json = res.json()
    access_token = token_json.get("access_token")
    scope = token_json.get("scope", "N/A")
    import logging
    logging.getLogger("uvicorn").info(f"[GMAIL REFRESH] Refreshed access token successfully. Scope: {repr(scope)}")
    return access_token


def get_user_gmail_credential(db: Session, user_id: str) -> Dict[str, Any] | None:
    """Decrypt and retrieve latest stored Gmail OAuth credential for a user."""
    creds = (
        db.query(Credential)
        .filter(
            Credential.user_id == user_id,
            Credential.type == "oauth2",
        )
        .order_by(Credential.created_at.desc())
        .all()
    )
    fernet = Fernet(settings.SECRET_KEY.encode())
    for cred in creds:
        try:
            decrypted = json.loads(fernet.decrypt(cred.encrypted_data.encode()).decode())
            if decrypted.get("provider") == "gmail":
                return decrypted
        except Exception:
            pass
    return None


import base64


def _extract_email_body(payload: Dict[str, Any]) -> str:
    """Extract plain text body from Gmail API payload object."""
    if not payload:
        return ""

    # Direct body
    body_data = payload.get("body", {}).get("data")
    if body_data:
        try:
            return base64.urlsafe_b64decode(body_data).decode("utf-8", errors="ignore")
        except Exception:
            pass

    # Multipart body
    parts = payload.get("parts", [])
    for part in parts:
        if part.get("mimeType") == "text/plain":
            data = part.get("body", {}).get("data")
            if data:
                try:
                    return base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                except Exception:
                    pass

    return ""


async def fetch_gmail_messages(access_token: str, query: str = "", max_results: int = 10) -> List[Dict[str, Any]]:
    """Fetch messages matching query from Gmail API."""
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"q": query, "maxResults": max_results}

    async with httpx.AsyncClient() as client:
        # List message IDs
        list_res = await client.get(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages",
            headers=headers,
            params=params,
        )
        if list_res.status_code != 200:
            raise ValueError(f"Gmail API error listing messages: {list_res.text}")

        message_ids = [m["id"] for m in list_res.json().get("messages", [])]
        messages = []

        # Fetch message details
        for msg_id in message_ids:
            msg_res = await client.get(
                f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=full",
                headers=headers,
            )
            if msg_res.status_code == 200:
                data = msg_res.json()
                payload = data.get("payload", {})
                headers_list = payload.get("headers", [])

                subject = next((h["value"] for h in headers_list if h["name"].lower() == "subject"), "")
                sender = next((h["value"] for h in headers_list if h["name"].lower() == "from"), "")
                date = next((h["value"] for h in headers_list if h["name"].lower() == "date"), "")
                snippet = data.get("snippet", "")
                body = _extract_email_body(payload) or snippet

                messages.append({
                    "id": msg_id,
                    "subject": subject,
                    "from": sender,
                    "date": date,
                    "snippet": snippet,
                    "body": body,
                })

        return messages


import os
import mimetypes
from pathlib import Path
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

OUTPUT_DIR = Path(os.environ.get("NODERIFT_OUTPUT_DIR", "/tmp/noderift_outputs"))


def resolve_attachment_path(file_ref: str) -> Path | None:
    """Find file on filesystem from path, filename, or output dir."""
    if not file_ref or not isinstance(file_ref, str):
        return None
    raw = file_ref.strip()
    if not raw:
        return None

    # Check candidates
    candidates = [
        Path(raw),
        OUTPUT_DIR / raw,
        Path.cwd() / raw,
        Path("/tmp/noderift_outputs") / raw,
        Path.home() / raw,
    ]
    for p in candidates:
        if p.is_file() and p.exists():
            return p

    # If raw is a path like /path/to/report.xlsx, check basename in OUTPUT_DIR
    basename = Path(raw).name
    base_candidate = OUTPUT_DIR / basename
    if base_candidate.is_file() and base_candidate.exists():
        return base_candidate

    return None


async def send_gmail_message(
    access_token: str,
    to: str,
    subject: str,
    body: str,
    attachments: List[str] | str | None = None,
) -> Dict[str, Any]:
    """Send an email via Gmail API with optional file attachments (Excel, CSV, PDF, etc.)."""
    message = MIMEMultipart()
    message["to"] = to
    message["subject"] = subject

    # Attach text or html body
    body_str = body or ""
    if any(tag in body_str.lower() for tag in ["<html", "<p>", "<div>", "<br>", "<table"]):
        message.attach(MIMEText(body_str, "html", "utf-8"))
    else:
        message.attach(MIMEText(body_str, "plain", "utf-8"))

    # Process attachments
    attached_files = []
    if attachments:
        if isinstance(attachments, str):
            attachments = [attachments]

        for att in attachments:
            if not att:
                continue
            resolved_path = resolve_attachment_path(str(att))
            if resolved_path and resolved_path.exists():
                filename = resolved_path.name
                mime_type, _ = mimetypes.guess_type(filename)
                if not mime_type:
                    if filename.endswith(".xlsx"):
                        mime_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    elif filename.endswith(".xls"):
                        mime_type = "application/vnd.ms-excel"
                    elif filename.endswith(".csv"):
                        mime_type = "text/csv"
                    elif filename.endswith(".pdf"):
                        mime_type = "application/pdf"
                    elif filename.endswith(".json"):
                        mime_type = "application/json"
                    elif filename.endswith(".png"):
                        mime_type = "image/png"
                    elif filename.endswith(".jpg") or filename.endswith(".jpeg"):
                        mime_type = "image/jpeg"
                    else:
                        mime_type = "application/octet-stream"

                maintype, subtype = mime_type.split("/", 1)
                part = MIMEBase(maintype, subtype)
                with open(resolved_path, "rb") as f:
                    part.set_payload(f.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f'attachment; filename="{filename}"')
                message.attach(part)
                attached_files.append(filename)

    raw_bytes = message.as_bytes()
    raw_b64 = base64.urlsafe_b64encode(raw_bytes).decode("utf-8")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    payload = {"raw": raw_b64}

    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            headers=headers,
            json=payload,
            timeout=30.0,
        )

    if res.status_code not in (200, 201):
        raise ValueError(f"Gmail API error sending email ({res.status_code}): {res.text}")

    result = res.json()
    result["attachments"] = attached_files
    return result
