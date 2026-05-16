from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone
import uuid


class CronTrigger(Base):
    __tablename__ = "cron_triggers"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    cron_expression = Column(String, nullable=False)          # e.g. "0 9 * * 1-5"
    timezone = Column(String, default="UTC", nullable=False)  # e.g. "Asia/Kolkata"
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    workflow = relationship("Workflow", back_populates="cron_triggers")
