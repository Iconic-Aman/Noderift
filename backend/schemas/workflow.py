from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    graph: Dict[str, Any] = Field(default_factory=lambda: {"nodes": [], "edges": []})
    is_active: bool = False

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class Workflow(WorkflowBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowShort(BaseModel):
    id: str
    name: str
    is_active: bool
    node_count: int = 0
    last_execution: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WorkflowList(BaseModel):
    items: List[WorkflowShort]
    total: int
    page: int
    size: int
