import httpx
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import json
from models.credential import Credential
from core.config import settings


def get_user_slack_credential(db: Session, user_id: str, credential_id: Optional[str] = None) -> Dict[str, Any] | None:
    """Decrypt and retrieve stored Slack OAuth credential for a user."""
    fernet = Fernet(settings.SECRET_KEY.encode())

    # If specific credential_id provided, look it up directly
    if credential_id:
        cred = db.query(Credential).filter(Credential.id == credential_id, Credential.user_id == user_id).first()
        if cred:
            try:
                decrypted = json.loads(fernet.decrypt(cred.encrypted_data.encode()).decode())
                if decrypted.get("provider") == "slack" or "access_token" in decrypted or "bot_access_token" in decrypted:
                    return decrypted
            except Exception:
                pass

    # Otherwise find latest Slack OAuth credential for user
    creds = (
        db.query(Credential)
        .filter(
            Credential.user_id == user_id,
            Credential.type == "oauth2",
        )
        .order_by(Credential.created_at.desc())
        .all()
    )
    for cred in creds:
        try:
            decrypted = json.loads(fernet.decrypt(cred.encrypted_data.encode()).decode())
            if decrypted.get("provider") == "slack":
                return decrypted
        except Exception:
            pass
    return None


async def send_slack_message(access_token: str, channel: str, message: str) -> Dict[str, Any]:
    """Send a message to a Slack channel using Slack Web API."""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json; charset=utf-8",
    }
    payload = {
        "channel": channel,
        "text": message,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            "https://slack.com/api/chat.postMessage",
            headers=headers,
            json=payload,
        )

    if res.status_code != 200:
        raise RuntimeError(f"Slack API HTTP error {res.status_code}: {res.text}")

    data = res.json()
    if not data.get("ok"):
        raise RuntimeError(f"Slack API error: {data.get('error', 'unknown_error')}")

    return data
