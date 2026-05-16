from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class CredentialBase(BaseModel):
    name: str
    type: str  # api_key | oauth2 | basic_auth | custom

class CredentialCreate(CredentialBase):
    data: Dict[str, Any]

class Credential(CredentialBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True
