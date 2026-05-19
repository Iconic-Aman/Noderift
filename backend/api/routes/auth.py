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
    tags=["auth"],
    dependencies=[Depends(bearer_scheme)])

@router.get("/google/login")
async def google_login():
    logger.info("[STEP 1] /auth/google/login called")
    logger.info(f"[STEP 1] GOOGLE_CLIENT_ID={repr(settings.GOOGLE_CLIENT_ID)}")
    logger.info(f"[STEP 1] GOOGLE_REDIRECT_URI={repr(settings.GOOGLE_REDIRECT_URI)}")
    logger.info(f"[STEP 1] GOOGLE_AUTH_URL={repr(settings.GOOGLE_AUTH_URL)}")

    if not settings.GOOGLE_CLIENT_ID:
        logger.error("[STEP 1] GOOGLE_CLIENT_ID is empty — OAuth will fail")
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    url = f"{settings.GOOGLE_AUTH_URL}?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile&access_type=offline"
    logger.info(f"[STEP 1] Redirecting to Google: {url}")
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    logger.info("[STEP 2] /auth/google/callback called")
    logger.info(f"[STEP 2] code received (first 20 chars): {repr(code[:20])}")

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

    access_token = token_res.json().get("access_token")
    logger.info(f"[STEP 2] Access token: {'obtained' if access_token else 'MISSING'}")

    # Fetch user info from Google
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            settings.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )

    logger.info(f"[STEP 2] Userinfo status: {user_res.status_code}")
    if user_res.status_code != 200:
        logger.error(f"[STEP 2] Userinfo failed: {user_res.text}")
        raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

    google_user = user_res.json()
    email = google_user.get("email")
    name = google_user.get("name")
    picture = google_user.get("picture")
    logger.info(f"[STEP 2] Google user: email={email}, name={name}")

    # Upsert user in DB by email (handles both new and existing users regardless of how they signed up)
    user = db.query(User).filter(User.email == email).first()
    if user:
        logger.info(f"[STEP 2] Existing user found: id={user.id}")
        user.name = name
        user.picture = picture
        db.commit()
        db.refresh(user)
    else:
        logger.info(f"[STEP 2] Creating new user for email={email}")
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

    # Redirect to frontend with DB user UUID (not Google token)
    logger.info(f"[STEP 2] Redirecting to frontend with user.id={user.id}")
    redirect_url = f"{settings.FRONTEND_URL}/login?token={user.id}"
    return RedirectResponse(url=redirect_url)

@router.get("/me")
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
            "name": "Aman Kumar",
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
