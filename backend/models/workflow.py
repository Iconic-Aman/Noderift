from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone
import uuid


def _jsonb_or_json():
    """Use JSONB on Postgres, fallback JSON for SQLite."""
    try:
        return JSONB
    except Exception:
        return JSON


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    graph = Column(JSON, nullable=False, default=lambda: {"nodes": [], "edges": []})
    chat_history = Column(JSON, nullable=True, default=list)
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="workflows")
    executions = relationship("Execution", back_populates="workflow", cascade="all, delete-orphan")
    webhooks = relationship("Webhook", back_populates="workflow", cascade="all, delete-orphan")
    cron_triggers = relationship("CronTrigger", back_populates="workflow", cascade="all, delete-orphan")
