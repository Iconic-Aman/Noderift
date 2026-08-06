import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet

from core.config import settings
from core.database import get_db
from models.credential import Credential

router = APIRouter(prefix="/oauth/gmail", tags=["Gmail OAuth"])

import urllib.parse

GMAIL_SCOPE = "openid email profile https://www.googleapis.com/auth/gmail.readonly"


@router.get("/start")
async def gmail_oauth_start(user_id: str):
    """Start Google OAuth for Gmail read-only access."""
    params = {
        "response_type": "code",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": GMAIL_SCOPE,
        "access_type": "offline",
        "prompt": "consent",
        "state": user_id,
    }
    url = f"{settings.GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url)


@router.get("/callback")
async def gmail_oauth_callback(code: str, state: str = Query(...), db: Session = Depends(get_db)):
    """Exchange authorization code for tokens and store encrypted refresh token."""
    user_id = state

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            settings.GOOGLE_TOKEN_URL,
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            },
        )

    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"OAuth token exchange failed: {token_res.text}")

    tokens = token_res.json()
    refresh_token = tokens.get("refresh_token")
    access_token = tokens.get("access_token")

    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token returned by Google. Prompt consent required.")

    # Get user email from google userinfo
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            settings.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
    user_email = user_res.json().get("email", "") if user_res.status_code == 200 else ""

    # Encrypt credential data
    cred_blob = json.dumps({
        "provider": "gmail",
        "refresh_token": refresh_token,
        "email": user_email,
    })
    fernet = Fernet(settings.SECRET_KEY.encode())
    encrypted = fernet.encrypt(cred_blob.encode()).decode()

    # Upsert credential in DB
    existing = (
        db.query(Credential)
        .filter(Credential.user_id == user_id, Credential.name == "Gmail OAuth")
        .first()
    )
    if existing:
        existing.encrypted_data = encrypted
    else:
        new_cred = Credential(
            user_id=user_id,
            name="Gmail OAuth",
            type="oauth2",
            encrypted_data=encrypted,
        )
        db.add(new_cred)

    db.commit()

    frontend_redirect = f"{settings.FRONTEND_URL}/oauth/success?provider=gmail"
    return RedirectResponse(url=frontend_redirect)
