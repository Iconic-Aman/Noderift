from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any

class NodeLogBase(BaseModel):
    execution_id: str
    node_id: str
    node_type: str
    status: str = "pending"
    input: Optional[Any] = None
    output: Optional[Any] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None

class NodeLogCreate(NodeLogBase):
    pass

class NodeLog(NodeLogBase):
    id: str
    started_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True
