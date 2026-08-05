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
    return res.json().get("access_token")


def get_user_gmail_credential(db: Session, user_id: str) -> Dict[str, Any] | None:
    """Decrypt and retrieve stored Gmail OAuth credential for a user."""
    cred = (
        db.query(Credential)
        .filter(
            Credential.user_id == user_id,
            Credential.type == "oauth2",
        )
        .first()
    )
    if not cred:
        return None

    fernet = Fernet(settings.SECRET_KEY.encode())
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
