from fastapi import Request
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
import hashlib
import secrets

# Defines Bearer Auth for Swagger UI without blocking public routes
bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100_000,
    )
    return f"pbkdf2:sha256:100000${salt}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    try:
        if hashed_password.startswith("pbkdf2:"):
            parts = hashed_password.split("$")
            if len(parts) != 3:
                return False
            method_info, salt, stored_hash = parts
            iterations = int(method_info.split(":")[2])
            key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                iterations,
            )
            return secrets.compare_digest(key.hex(), stored_hash)
        return False
    except Exception:
        return False

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Check Header (for Swagger/testing)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            request.state.token = auth_header.split(" ")[1]
        else:
            # 2. Fallback to Cookie (for OAuth flow / session)
            request.state.token = request.cookies.get("access_token")
            
        return await call_next(request)

