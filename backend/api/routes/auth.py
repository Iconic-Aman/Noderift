from multiprocessing.spawn import import_main_path
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from core.config import settings
from dotenv import load_dotenv
load_dotenv()
from fastapi import Depends
import os
import logging
from core.database import get_db
from sqlalchemy.orm import Session
from models.user import User
from datetime import datetime, timezone
from uuid import uuid4
from core.security import bearer_scheme

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth", 
    tags=["auth"]
)

@router.get("/google/login")
async def google_login():
    logger.info("[STEP 1] /auth/google/login called")
    logger.info(f"[STEP 1] GOOGLE_CLIENT_ID={repr(settings.GOOGLE_CLIENT_ID)}")
    logger.info(f"[STEP 1] GOOGLE_REDIRECT_URI={repr(settings.GOOGLE_REDIRECT_URI)}")
    logger.info(f"[STEP 1] GOOGLE_AUTH_URL={repr(settings.GOOGLE_AUTH_URL)}")

    if not settings.GOOGLE_CLIENT_ID:
        logger.error("[STEP 1] GOOGLE_CLIENT_ID is empty — OAuth will fail")
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    url = f"{settings.GOOGLE_AUTH_URL}?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile%20https://www.googleapis.com/auth/gmail.readonly&access_type=offline&prompt=consent"
    logger.info(f"[STEP 1] Redirecting to Google: {url}")
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str, state: str = None, db: Session = Depends(get_db)):
    logger.info("[STEP 2] /auth/google/callback called")
    logger.info(f"[STEP 2] code received (first 20 chars): {repr(code[:20])}, state={state}")

    # Exchange code for tokens
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

    logger.info(f"[STEP 2] Token exchange status: {token_res.status_code}")
    if token_res.status_code != 200:
        logger.error(f"[STEP 2] Token exchange failed: {token_res.text}")
        raise HTTPException(status_code=400, detail="Failed to fetch token")

    tokens = token_res.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    logger.info(f"[STEP 2] Access token: {'obtained' if access_token else 'MISSING'}")

    # If state contains user_id (from Gmail OAuth flow)
    target_user = None
    if state:
        target_user = db.query(User).filter(User.id == str(state)).first()
        logger.info(f"[STEP 2] Gmail OAuth state={repr(state)}, found target_user={target_user}")
        if not target_user:
            raise HTTPException(status_code=404, detail=f"User '{state}' not found in database. Please log in first.")
        user = target_user
        email = user.email
    else:
        # Fetch user info from Google (login flow)
        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                settings.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
        if user_res.status_code != 200:
            logger.error(f"[STEP 2] Userinfo failed: {user_res.text}")
            raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")
        google_user = user_res.json()
        email = google_user.get("email", "")
        name = google_user.get("name", "")
        picture = google_user.get("picture", "")

        user = db.query(User).filter(User.email == email).first()
        if user:
            user.name = name
            user.picture = picture
            db.commit()
            db.refresh(user)
        else:
            user = User(
                id=str(uuid4()),
                email=email,
                name=name,
                picture=picture,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    # Store encrypted Gmail credential if refresh_token was returned and Gmail scope was granted
    granted_scope = tokens.get("scope", "")
    logger.info(f"[STEP 2] Granted scope from Google: {repr(granted_scope)}")

    if refresh_token and ("gmail" in granted_scope or state):
        from models.credential import Credential
        from cryptography.fernet import Fernet
        import json as _json
        cred_blob = _json.dumps({
            "provider": "gmail",
            "refresh_token": refresh_token,
            "email": email or user.email,
            "scope": granted_scope,
        })
        fernet = Fernet(settings.SECRET_KEY.encode())
        encrypted = fernet.encrypt(cred_blob.encode()).decode()

        existing_cred = db.query(Credential).filter(
            Credential.user_id == user.id,
            Credential.name == "Gmail OAuth"
        ).first()
        if existing_cred:
            existing_cred.encrypted_data = encrypted
        else:
            db.add(Credential(
                user_id=user.id,
                name="Gmail OAuth",
                type="oauth2",
                encrypted_data=encrypted,
            ))
        db.commit()

    if state:
        redirect_url = f"{settings.FRONTEND_URL}/oauth-success?provider=gmail"
    else:
        redirect_url = f"{settings.FRONTEND_URL}/login?token={user.id}"
    return RedirectResponse(url=redirect_url)

@router.get("/me", dependencies=[Depends(bearer_scheme)])
async def get_me(request: Request):
    logger.info("[STEP 3] /auth/me called")
    token = request.state.token
    logger.info(f"[STEP 3] token from state: {repr(token)}")

    if not token:
        logger.warning("[STEP 3] No token found — returning 401")
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    auth_key = os.getenv("AUTH_KEY")
    if token != auth_key:
        logger.info("[STEP 3] Token != AUTH_KEY, returning mock user")
        return {
            "id": "test",
            "email": "[EMAIL_ADDRESS]",
            "name": "Test User",
            "created_at": "2025-05-03T08:30:00Z"
        }
        
    logger.info(f"[STEP 3] Fetching user info from {settings.GOOGLE_USERINFO_URL}")
    if not settings.GOOGLE_USERINFO_URL:
        logger.error("[STEP 3] GOOGLE_USERINFO_URL is empty")
        raise HTTPException(status_code=401, detail="Incorrect auth value")
    
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            settings.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token}"}
        )
    
    logger.info(f"[STEP 3] Userinfo response status: {user_res.status_code}")
    if user_res.status_code != 200:
        logger.error(f"[STEP 3] Userinfo failed: {user_res.text}")
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_data = user_res.json()
    logger.info(f"[STEP 3] User fetched: email={user_data.get('email')}")
    return {
        "id": user_data.get("id"),
        "email": user_data.get("email"),
        "name": user_data.get("name"),
        "picture": user_data.get("picture"),
        "created_at": "2025-05-03T08:30:00Z"
    }

@router.post("/logout")
async def logout(response: Response):
    logger.info("[STEP 4] /auth/logout called — clearing access_token cookie")
    response.delete_cookie("access_token")
    return {"status": "success"}
