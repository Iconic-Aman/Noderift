from fastapi import Request
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

# Defines Bearer Auth for Swagger UI without blocking public routes
bearer_scheme = HTTPBearer(auto_error=False)

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Check Header (for Swagger/testing)
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            request.state.token = auth_header.split(" ")[1]
        else:
            # 2. Fallback to Cookie (for actual Google OAuth flow)
            request.state.token = request.cookies.get("access_token")
            
        return await call_next(request)
