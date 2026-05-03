from fastapi import Request
from fastapi.security import HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

# Defines Bearer Auth for Swagger UI without blocking public routes
bearer_scheme = HTTPBearer(auto_error=False)

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extracts token from header and stores in state for upcoming routes
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            request.state.token = auth_header.split(" ")[1]
        else:
            request.state.token = None
        
        return await call_next(request)
