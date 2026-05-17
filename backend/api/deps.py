from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from models.user import User


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Extract token from request state (set by AuthMiddleware) and return DB user."""
    token = getattr(request.state, "token", None)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Dev bypass
    if token == "test_token" or token == "test":
        user = db.query(User).filter(User.email == "dev@test.com").first()
        if not user:
            from uuid import uuid4
            from datetime import datetime, timezone
            user = User(
                id=str(uuid4()),
                email="dev@test.com",
                hashed_password="test",
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    user = db.query(User).filter(User.id == token).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user
