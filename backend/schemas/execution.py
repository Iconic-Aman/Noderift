from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime

class NodeLogResponse(BaseModel):
    id: str
    execution_id: str
    node_id: str
    node_type: str
    status: str
    input: Optional[Dict[str, Any]] = None
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    duration_ms: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExecutionResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    triggered_by: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True

class ExecutionDetailResponse(ExecutionResponse):
    node_logs: List[NodeLogResponse] = []

    class Config:
        from_attributes = True
