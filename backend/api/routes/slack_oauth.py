import json
import urllib.parse
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from core.config import settings
from core.database import get_db
from models.credential import Credential

router = APIRouter(prefix="/oauth/slack", tags=["Slack OAuth"])

SLACK_SCOPES = "chat:write,channels:read,chat:write.public,groups:read"


@router.get("/start")
async def slack_oauth_start(user_id: str):
    """Start Slack OAuth v2 flow for bot/workspace access."""
    if not settings.SLACK_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="Slack OAuth is not configured. Please set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET."
        )

    redirect_uri = settings.SLACK_REDIRECT_URI or f"{settings.FRONTEND_URL}/api/oauth/slack/callback"

    params = {
        "client_id": settings.SLACK_CLIENT_ID,
        "scope": SLACK_SCOPES,
        "redirect_uri": redirect_uri,
        "state": user_id,
    }
    url = f"{settings.SLACK_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/callback")
async def slack_oauth_callback(code: str, state: str = Query(...), db: Session = Depends(get_db)):
    """Exchange authorization code for Slack OAuth tokens and store encrypted in credentials."""
    user_id = state
    redirect_uri = settings.SLACK_REDIRECT_URI or f"{settings.FRONTEND_URL}/api/oauth/slack/callback"

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            settings.SLACK_TOKEN_URL,
            data={
                "client_id": settings.SLACK_CLIENT_ID,
                "client_secret": settings.SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Slack OAuth token exchange failed: {token_res.text}")

    tokens = token_res.json()
    if not tokens.get("ok"):
        raise HTTPException(status_code=400, detail=f"Slack OAuth error: {tokens.get('error', 'unknown_error')}")

    access_token = tokens.get("access_token")
    team = tokens.get("team", {})
    team_name = team.get("name", "Slack Workspace")
    bot_user_id = tokens.get("bot_user_id", "")

    if not access_token:
        raise HTTPException(status_code=400, detail="No access token returned by Slack.")

    # Encrypt credential data
    cred_blob = json.dumps({
        "provider": "slack",
        "access_token": access_token,
        "team_name": team_name,
        "team_id": team.get("id", ""),
        "bot_user_id": bot_user_id,
        "authed_user": tokens.get("authed_user", {}),
    })
    fernet = Fernet(settings.SECRET_KEY.encode())
    encrypted = fernet.encrypt(cred_blob.encode()).decode()

    # Upsert credential in DB
    existing = (
        db.query(Credential)
        .filter(Credential.user_id == user_id, Credential.name == f"Slack ({team_name})")
        .first()
    )
    if not existing:
        existing = (
            db.query(Credential)
            .filter(Credential.user_id == user_id, Credential.name.like("Slack%"))
            .first()
        )

    if existing:
        existing.name = f"Slack ({team_name})"
        existing.encrypted_data = encrypted
    else:
        new_cred = Credential(
            user_id=user_id,
            name=f"Slack ({team_name})",
            type="oauth2",
            encrypted_data=encrypted,
        )
        db.add(new_cred)

    db.commit()

    frontend_redirect = f"{settings.FRONTEND_URL}/oauth/success?provider=slack"
    return RedirectResponse(url=frontend_redirect)
