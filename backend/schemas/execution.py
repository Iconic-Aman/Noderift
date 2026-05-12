from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class ExecutionBase(BaseModel):
    workflow_id: str
    triggered_by: str = "manual"  # manual | webhook | cron

class ExecutionCreate(ExecutionBase):
    input_data: Optional[Dict[str, Any]] = None

class Execution(ExecutionBase):
    id: str
    status: str  # pending | running | success | failed | cancelled
    started_at: datetime
    finished_at: Optional[datetime] = None
    error: Optional[str] = None

    class Config:
        from_attributes = True

class NodeLog(BaseModel):
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

class ExecutionDetail(Execution):
    node_logs: List[NodeLog] = []
