from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User
import logging

logger = logging.getLogger(__name__)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Extract token from request state (set by AuthMiddleware) and return DB user."""
    token = getattr(request.state, "token", None)
    logger.info(f"[AUTH get_current_user] Received token: {repr(token)}")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Dev bypass only for literal test_token or test
    if token == "test_token" or token == "test":
        logger.warning("[AUTH get_current_user] Using dev bypass 'dev@test.com'")
        user = db.query(User).filter(User.email == "dev@test.com").first()
        if not user:
            from uuid import uuid4
            from datetime import datetime, timezone
            user = User(
                id=str(uuid4()),
                email="dev@test.com",
                name="Dev User",
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    user = db.query(User).filter(User.id == token).first()
    if not user:
        logger.error(f"[AUTH get_current_user] No user found for id={token}")
        raise HTTPException(status_code=401, detail="User not found")

    logger.info(f"[AUTH get_current_user] Resolved user: email={user.email}, name={user.name}")
    return user


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    """Optionally extract token from request state; returns User or None if unauthenticated."""
    token = getattr(request.state, "token", None)
    if not token:
        return None

    if token == "test_token" or token == "test":
        return db.query(User).filter(User.email == "dev@test.com").first()

    return db.query(User).filter(User.id == token).first()
