from sqlalchemy import Column, String, DateTime, Integer, ForeignKey
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime, timezone
import uuid


class NodeLog(Base):
    __tablename__ = "node_logs"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    execution_id = Column(String, ForeignKey("executions.id", ondelete="CASCADE"), nullable=False, index=True)
    node_id = Column(String, nullable=False)       # React Flow node ID
    node_type = Column(String, nullable=False)     # e.g. "http_request"
    # success | failed
    status = Column(String, nullable=False, default="pending")
    input = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    finished_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    execution = relationship("Execution", back_populates="node_logs")
