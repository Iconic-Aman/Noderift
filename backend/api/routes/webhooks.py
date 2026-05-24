from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from core.database import get_db
from models.webhook import Webhook
from models.workflow import Workflow
from models.execution import Execution
from core.celery_app import celery_app

router = APIRouter(
    prefix="/webhooks",
    tags=["webhooks"]
)

@router.post("/{slug}", status_code=202)
async def trigger_webhook(slug: str, request: Request, db: Session = Depends(get_db)):
    """Public webhook trigger endpoint to run workflows automatically."""
    hook = db.query(Webhook).filter(Webhook.slug == slug).first()
    if not hook:
        raise HTTPException(status_code=404, detail="Webhook trigger not found")

    wf = db.query(Workflow).filter(Workflow.id == hook.workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    if not wf.is_active:
        raise HTTPException(status_code=400, detail="Workflow is inactive")

    # Capture request body safely
    try:
        body = await request.json()
    except Exception:
        try:
            body_bytes = await request.body()
            body = body_bytes.decode("utf-8") if body_bytes else {}
        except Exception:
            body = {}

    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("authorization", "cookie")}
    query_params = dict(request.query_params)

    # Create execution record
    execution = Execution(
        workflow_id=wf.id,
        status="pending",
        triggered_by="webhook"
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # Trigger async execution task via Celery
    payload = {
        "body": body,
        "headers": headers,
        "query": query_params
    }
    celery_app.send_task("worker.run_workflow_task", args=[execution.id], kwargs={"trigger_payload": payload})

    return {
        "execution_id": execution.id,
        "status": "enqueued",
        "message": f"Workflow {wf.name} triggered successfully."
    }
