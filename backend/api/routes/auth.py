from multiprocessing.spawn import import_main_path
from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import RedirectResponse
import httpx
from pydantic import BaseModel, Field
from typing import Optional
from core.config import settings
from dotenv import load_dotenv
load_dotenv()
import os
import logging
from core.database import get_db
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models.user import User
from datetime import datetime, timezone
from uuid import uuid4
from core.security import bearer_scheme, hash_password, verify_password
from api.deps import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth", 
    tags=["auth"]
)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)
    email: Optional[str] = None
    name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)  # Can be username or email
    password: str = Field(..., min_length=1)


@router.post("/register")
@router.post("/signup")
async def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    clean_username = req.username.strip()
    clean_email = req.email.strip().lower() if req.email and req.email.strip() else None
    clean_name = req.name.strip() if req.name and req.name.strip() else None

    # Check for existing username
    existing_user = db.query(User).filter(User.username.ilike(clean_username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username is already taken")

    # Check for existing email if provided
    if clean_email:
        existing_email = db.query(User).filter(User.email == clean_email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email is already registered")

    pwd_hash = hash_password(req.password)
    new_user = User(
        id=str(uuid4()),
        username=clean_username,
        email=clean_email,
        password_hash=pwd_hash,
        name=clean_name or clean_username,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    response.set_cookie(
        key="access_token",
        value=new_user.id,
        httponly=True,
        samesite="lax",
        max_age=86400 * 30,
    )

    first_name = (new_user.name.split()[0] if new_user.name else (new_user.username or "User"))
    logger.info(f"[AUTH] User registered: id={new_user.id}, username={new_user.username}")

    return {
        "status": "success",
        "token": new_user.id,
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "name": new_user.name,
            "first_name": first_name,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
        }
    }


@router.post("/login")
async def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    identifier = req.username.strip()

    # Match against username OR email
    user = db.query(User).filter(
        or_(
            User.username.ilike(identifier),
            User.email.ilike(identifier)
        )
    ).first()

    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        logger.warning(f"[AUTH] Failed login attempt for identifier: {identifier}")
        raise HTTPException(status_code=401, detail="Invalid username/email or password")

    response.set_cookie(
        key="access_token",
        value=user.id,
        httponly=True,
        samesite="lax",
        max_age=86400 * 30,
    )

    first_name = (user.name.split()[0] if user.name else (user.username or (user.email.split("@")[0] if user.email else "User")))
    logger.info(f"[AUTH] User logged in: id={user.id}, username={user.username}, email={user.email}")

    return {
        "status": "success",
        "token": user.id,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": user.name or user.username or (user.email.split("@")[0] if user.email else "User"),
            "first_name": first_name,
            "picture": getattr(user, "picture", None),
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
    }


@router.get("/google/login")
async def google_login():
    logger.info("[AUTH] /auth/google/login called")
    if not settings.GOOGLE_CLIENT_ID:
        logger.error("[AUTH] GOOGLE_CLIENT_ID is empty — OAuth will fail")
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    url = f"{settings.GOOGLE_AUTH_URL}?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile&access_type=offline&prompt=consent"
    logger.info(f"[AUTH] Redirecting to Google: {url}")
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str, state: str = None, db: Session = Depends(get_db)):
    logger.info("[AUTH] /auth/google/callback received")
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
        logger.error(f"[AUTH] Token exchange failed: {token_res.text}")
        raise HTTPException(status_code=400, detail="Failed to fetch token")

    tokens = token_res.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")

    target_user = None
    if state:
        target_user = db.query(User).filter(User.id == str(state)).first()
        if not target_user:
            raise HTTPException(status_code=404, detail=f"User '{state}' not found in database.")
        user = target_user
        email = user.email
    else:
        async with httpx.AsyncClient() as client:
            user_res = await client.get(
                settings.GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
        if user_res.status_code != 200:
            logger.error(f"[AUTH] Userinfo failed: {user_res.text}")
            raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")
        google_user = user_res.json()
        logger.info(f"[AUTH] Google userinfo raw response: {google_user}")

        email = google_user.get("email", "")
        name = google_user.get("name", "") or google_user.get("given_name", "")
        picture = google_user.get("picture", "")

        user = db.query(User).filter(User.email == email).first()
        if user:
            user.name = name or user.name
            user.picture = picture or user.picture
            db.commit()
            db.refresh(user)
            logger.info(f"[AUTH] Updated existing user: id={user.id}, email={user.email}, name={user.name}")
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
            logger.info(f"[AUTH] Created new user: id={user.id}, email={user.email}, name={user.name}")

    granted_scope = tokens.get("scope", "")
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
    logger.info(f"[AUTH] Redirecting to: {redirect_url}")
    return RedirectResponse(url=redirect_url)


@router.get("/me", dependencies=[Depends(bearer_scheme)])
async def get_me(user: User = Depends(get_current_user)):
    first_name = (user.name.split()[0] if user.name else (user.username or (user.email.split("@")[0] if user.email else "User")))
    logger.info(f"[AUTH /auth/me] user_id={user.id}, username={user.username}, email={user.email}, name={user.name}, first_name={first_name}")
    return {
        "id": user.id,
        "username": getattr(user, "username", None),
        "email": user.email,
        "name": user.name or user.username or (user.email.split("@")[0] if user.email else "User"),
        "first_name": first_name,
        "picture": getattr(user, "picture", None),
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


@router.post("/logout")
async def logout(response: Response):
    logger.info("[AUTH] /auth/logout called")
    response.delete_cookie("access_token")
    return {"status": "success"}

