from multiprocessing.spawn import import_main_path
from fastapi import APIRouter, Request, Response, HTTPException
from fastapi.responses import RedirectResponse
import httpx
from core.config import settings
from dotenv import load_dotenv
load_dotenv()
import os

router = APIRouter(prefix="/auth", tags=["auth"])

@router.get("/google/login")
async def google_login():
    url = f"{settings.GOOGLE_AUTH_URL}?response_type=code&client_id={settings.GOOGLE_CLIENT_ID}&redirect_uri={settings.GOOGLE_REDIRECT_URI}&scope=openid%20email%20profile&access_type=offline"
    return RedirectResponse(url)

@router.get("/google/callback")
async def google_callback(code: str):
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
        raise HTTPException(status_code=400, detail="Failed to fetch token")
        
    token_data = token_res.json()
    access_token = token_data.get("access_token")
    
    redirect_res = RedirectResponse(url=settings.FRONTEND_URL)
    redirect_res.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
    )
    return redirect_res

@router.get("/me")
async def get_me(request: Request):
    token = request.state.token
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
        
    auth_key = os.getenv("AUTH_KEY")
    if token == auth_key:
        return {
            "id": "test",
            "email": "[EMAIL_ADDRESS]",
            "name": "Aman Kumar",
            "created_at": "2025-05-03T08:30:00Z"
        }
        
    if not settings.GOOGLE_USERINFO_URL:
        raise HTTPException(status_code=500, detail="Google URLs missing in .env")
    
    async with httpx.AsyncClient() as client:
        user_res = await client.get(
            settings.GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token}"}
        )
        
    if user_res.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_data = user_res.json()
    return {
        "id": user_data.get("id"),
        "email": user_data.get("email"),
        "name": user_data.get("name"),
        "picture": user_data.get("picture"),
        "created_at": "2025-05-03T08:30:00Z"
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"status": "success"}
