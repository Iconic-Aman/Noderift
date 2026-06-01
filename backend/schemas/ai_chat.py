from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, List, Optional


class AIChatMessageOut(BaseModel):
    id: str
    role: str
    content: str
    meta: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIChatRequest(BaseModel):
    message: str
    credential_id: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None
    temperature: float = 0.7
    current_graph: Optional[Dict[str, Any]] = None
    node_catalog: List[Dict[str, Any]] = []


class AIChatResponse(BaseModel):
    message: AIChatMessageOut
    proposal: Optional[Dict[str, Any]] = None
    history: List[AIChatMessageOut]
