from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class WebhookBase(BaseModel):
    workflow_id: str
    description: Optional[str] = None

class WebhookCreate(WebhookBase):
    pass

class Webhook(WebhookBase):
    id: str
    slug: str
    url: str
    secret: str
    created_at: datetime

    class Config:
        from_attributes = True

class CronTriggerBase(BaseModel):
    workflow_id: str
    cron_expression: str
    timezone: str = "UTC"
    is_active: bool = True

class CronTriggerCreate(CronTriggerBase):
    pass

class CronTriggerUpdate(BaseModel):
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None

class CronTrigger(CronTriggerBase):
    id: str
    next_run_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
