from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Extract token from request state (set by AuthMiddleware) and return DB user."""
    token = getattr(request.state, "token", None)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Token is Google access_token — look up user by it stored in DB.
    # We store google_id == token sub; for now match via email fetched by auth route.
    # We use a lightweight approach: user row must exist (created on first OAuth callback).
    user = db.query(User).filter(User.id == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
