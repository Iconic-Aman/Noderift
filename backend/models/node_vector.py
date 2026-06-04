from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import JSON
from core.database import Base
from pgvector.sqlalchemy import Vector
from datetime import datetime, timezone
import uuid


class NodeEmbedding(Base):
    __tablename__ = "node_embeddings"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    node_type = Column(String, nullable=False, unique=True, index=True)  # e.g. "schedule", "http"
    label = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    schema_json = Column(JSON, nullable=False)  # Store the template schema
    embedding = Column(Vector(1024), nullable=False)  # 1024-dim vector for search
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class WorkflowExampleEmbedding(Base):
    __tablename__ = "workflow_example_embeddings"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    workflow_json = Column(JSON, nullable=False)  # The React Flow nodes and edges dict
    embedding = Column(Vector(1024), nullable=False)  # 1024-dim vector for search
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
