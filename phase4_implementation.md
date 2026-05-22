# Phase 4 — Triggers

Build trigger system so workflows start automatically. Webhooks run workflows on external HTTP POST. Scheduler runs workflows on timer.

---

## What We're Building

### 1. Webhook Triggers
* **Backend Endpoint**: `POST /api/webhooks/{slug}` to execute a specific workflow.
* **Payload Passing**: Extract request body, headers, and query parameters and supply them to the workflow's trigger node.
* **Frontend UI**: Display webhook configuration, dynamically generate target URL, and allow one-click copy.

### 2. Cron Triggers (Scheduled Runs)
* **Scheduler Daemon**: Lightweight, integrated `AsyncIOScheduler` (from `APScheduler`) running as a thread inside FastAPI.
* **Synchronization**: Add, update, or remove cron jobs dynamically in memory whenever workflows are saved or toggled active/inactive.
* **Cron UI**: Allow timezone and cron expression configuration on the canvas node config panel.

---

## Files to Create

### 🔧 Backend — Nodes

#### [NEW] `backend/nodes/webhook_node.py`
Provides trigger variables payload downstream to next nodes:
```python
from nodes.base import BaseNode, NodeInput, NodeOutput

class WebhookNode(BaseNode):
    node_type = "webhook"
    display_name = "Webhook"
    description = "Trigger workflow via HTTP webhook"

    async def execute(self, inputs: NodeInput, config: dict) -> NodeOutput:
        # Returns parsed inputs or raw payload injected by runner
        return NodeOutput(data=inputs.data)
```

#### [NEW] `backend/nodes/schedule_node.py`
Provides execution timestamp downstream:
```python
from nodes.base import BaseNode, NodeInput, NodeOutput
from datetime import datetime, timezone

class ScheduleNode(BaseNode):
    node_type = "schedule"
    display_name = "Schedule"
    description = "Run workflow on a schedule"

    async def execute(self, inputs: NodeInput, config: dict) -> NodeOutput:
        return NodeOutput(data={
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "cron": config.get("cron", "* * * * *")
        })
```

### ⚙️ Backend — Engine & Scheduler

#### [NEW] `backend/core/scheduler.py`
Configures background runner:
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class TriggerScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler started successfully")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler shut down successfully")

    def sync_triggers(self, db: Session):
        # Clears existing jobs and loads all active database CronTrigger entries
        pass

scheduler_manager = TriggerScheduler()
```

### 🌐 Backend — Routes

#### [NEW] `backend/api/routes/webhooks.py`
Exposes trigger execution:
```python
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from models.webhook import Webhook
from models.workflow import Workflow
from models.execution import Execution
from worker.worker import run_workflow_task

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

@router.post("/{slug}")
async def trigger_webhook(slug: str, request: Request, db: Session = Depends(get_db)):
    hook = db.query(Webhook).filter(Webhook.slug == slug).first()
    if not hook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    wf = db.query(Workflow).filter(Workflow.id == hook.workflow_id).first()
    if not wf or not wf.is_active:
        raise HTTPException(status_code=400, detail="Workflow not active")

    # Read body
    try:
        body = await request.json()
    except Exception:
        body = {}

    params = dict(request.query_params)
    headers = dict(request.headers)

    # Register Execution
    exc = Execution(
        workflow_id=wf.id,
        status="pending",
        triggered_by="webhook"
    )
    db.add(exc)
    db.commit()
    db.refresh(exc)

    trigger_payload = {"body": body, "headers": headers, "params": params}
    # Enqueue task
    run_workflow_task.delay(exc.id, trigger_payload=trigger_payload)

    return {"execution_id": exc.id, "status": "enqueued"}
```

---

## Files to Modify

### 1. `backend/main.py`
Include `webhooks` routes. Start scheduler on lifespan/startup events:
```python
# Startup
scheduler_manager.start()
scheduler_manager.sync_triggers(db)
# Shutdown
scheduler_manager.shutdown()
```

### 2. `backend/api/routes/workflows.py`
Add `GET /workflows/{id}/triggers` endpoint.
Sync `Webhook` and `CronTrigger` db records automatically whenever `update_workflow` is called with a workflow graph.

### 3. `backend/nodes/__init__.py`
Import and add trigger nodes to registration dictionary.

### 4. `backend/core/dag_runner.py`
In `run()` method, support passing `trigger_payload` to DAG execution state, passing it into inputs of the webhook node when executed.

---

## Frontend Changes

### 1. `node-palette.tsx`
Remove locks on `webhook` and `schedule` nodes.

### 2. `node-config-panel.tsx`
Fetch and display URL inside config details for Webhook nodes, showing a quick button to copy path.
