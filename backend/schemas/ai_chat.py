from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, Optional


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
    current_graph: Optional[Dict[str, Any]] = None


class AIChatResponse(BaseModel):
    message: AIChatMessageOut
    proposal: Optional[Dict[str, Any]] = None
    history: list[AIChatMessageOut]
