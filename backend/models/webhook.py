from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone
import uuid
import secrets


class Webhook(Base):
    __tablename__ = "webhooks"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String, nullable=True)
    slug = Column(String, unique=True, index=True, default=lambda: secrets.token_urlsafe(12))
    secret = Column(String, default=lambda: f"whsec_{secrets.token_urlsafe(32)}")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    workflow = relationship("Workflow", back_populates="webhooks")
