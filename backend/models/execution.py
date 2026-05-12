from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone
import uuid


class Execution(Base):
    __tablename__ = "executions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    # pending | running | success | failed | cancelled
    status = Column(String, default="pending", nullable=False)
    # manual | webhook | cron
    triggered_by = Column(String, default="manual", nullable=False)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(String, nullable=True)

    # Relationships
    workflow = relationship("Workflow", back_populates="executions")
    node_logs = relationship("NodeLog", back_populates="execution", cascade="all, delete-orphan")
