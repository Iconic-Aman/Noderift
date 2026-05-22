from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from core.database import get_db
from api.deps import get_current_user
from models.user import User
from models.workflow import Workflow
from models.webhook import Webhook
from models.cron_trigger import CronTrigger
from schemas.workflow import WorkflowCreate, WorkflowUpdate, Workflow as WorkflowSchema, WorkflowShort
from core.security import bearer_scheme

router = APIRouter(
    prefix="/workflows",
    tags=["workflows"],
    dependencies=[Depends(bearer_scheme)]
)


@router.get("/", response_model=List[WorkflowShort])
def list_workflows(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all workflows for the current user (no graph payload)."""
    rows = db.query(Workflow).filter(Workflow.user_id == current_user.id).all()
    return [
        WorkflowShort(
            id=w.id,
            name=w.name,
            is_active=w.is_active,
            node_count=len(w.graph.get("nodes", [])) if w.graph else 0,
            created_at=w.created_at,
        )
        for w in rows
    ]


@router.post("/", response_model=WorkflowSchema, status_code=201)
def create_workflow(body: WorkflowCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new workflow for the current user."""
    wf = Workflow(**body.model_dump(), user_id=current_user.id)
    db.add(wf)
    db.commit()
    db.refresh(wf)
    return wf


@router.get("/{workflow_id}", response_model=WorkflowSchema)
def get_workflow(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a single workflow by ID (includes full graph)."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf


import logging

logger = logging.getLogger(__name__)

@router.patch("/{workflow_id}", response_model=WorkflowSchema)
def update_workflow(workflow_id: str, body: WorkflowUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Partial update — name, description, graph, or is_active."""
    logger.warning(f"[PATCH WORKFLOW] Attempting to update workflow_id: {workflow_id} for user: {current_user.id}")
    
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        logger.warning(f"[PATCH WORKFLOW] Workflow {workflow_id} not found for user {current_user.id}")
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    try:
        update_data = body.model_dump(exclude_none=True)
        logger.warning(f"[PATCH WORKFLOW] Updating fields: {list(update_data.keys())}")
        
        for field, value in update_data.items():
            setattr(wf, field, value)
        wf.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        db.refresh(wf)
        
        # Sync triggers after saving graph changes
        if body.graph is not None or body.is_active is not None:
            sync_workflow_triggers(db, wf)
            
        logger.warning(f"[PATCH WORKFLOW] Successfully updated workflow {workflow_id}")
        return wf
    except Exception as e:
        logger.error(f"[PATCH WORKFLOW] Database error during update: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a workflow and all cascaded data."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(wf)
    db.commit()


@router.patch("/{workflow_id}/activate", response_model=WorkflowSchema)
def activate_workflow(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Toggle is_active on a workflow."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf.is_active = not wf.is_active
    wf.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wf)
    
    # Sync triggers on activation status toggle
    sync_workflow_triggers(db, wf)
    
    return wf


@router.post("/{workflow_id}/duplicate", response_model=WorkflowSchema, status_code=201)
def duplicate_workflow(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Clone a workflow — copies graph, resets is_active to False."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    clone = Workflow(
        user_id=current_user.id,
        name=f"Copy of {wf.name}",
        description=wf.description,
        graph=wf.graph,
        is_active=False,
    )
    db.add(clone)
    db.commit()
    db.refresh(clone)
    return clone


def sync_workflow_triggers(db: Session, workflow: Workflow):
    graph = workflow.graph or {}
    nodes = graph.get("nodes", [])
    
    has_webhook = False
    has_schedule = False
    cron_config = None
    
    for node in nodes:
        node_id = node.get("id", "")
        raw_type = node_id.split("-")[0] if "-" in node_id else node.get("type", "")
        if raw_type == "webhook":
            has_webhook = True
        elif raw_type == "schedule":
            has_schedule = True
            cron_config = node.get("data", {}).get("config", {})
            
    # Sync Webhook table
    db_hook = db.query(Webhook).filter(Webhook.workflow_id == workflow.id).first()
    if has_webhook:
        if not db_hook:
            db_hook = Webhook(workflow_id=workflow.id)
            db.add(db_hook)
    else:
        if db_hook:
            db.delete(db_hook)
            
    # Sync CronTrigger table
    db_cron = db.query(CronTrigger).filter(CronTrigger.workflow_id == workflow.id).first()
    if has_schedule:
        cron_expr = cron_config.get("cron", "0 * * * *") if cron_config else "0 * * * *"
        timezone_val = cron_config.get("timezone", "UTC") if cron_config else "UTC"
        
        if db_cron:
            db_cron.cron_expression = cron_expr
            db_cron.timezone = timezone_val
            db_cron.is_active = workflow.is_active
        else:
            db_cron = CronTrigger(
                workflow_id=workflow.id,
                cron_expression=cron_expr,
                timezone=timezone_val,
                is_active=workflow.is_active
            )
            db.add(db_cron)
        db.commit()
        db.refresh(db_cron)
        
        # Sync with APScheduler
        from core.scheduler import scheduler_manager
        if workflow.is_active:
            scheduler_manager.add_workflow_job(
                db_cron.id,
                workflow.id,
                db_cron.cron_expression,
                db_cron.timezone
            )
        else:
            scheduler_manager.remove_workflow_job(db_cron.id)
    else:
        if db_cron:
            # Remove from APScheduler first
            from core.scheduler import scheduler_manager
            scheduler_manager.remove_workflow_job(db_cron.id)
            db.delete(db_cron)
            
    db.commit()


@router.get("/{workflow_id}/triggers")
def get_workflow_triggers(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get trigger details (webhook slug/secret and cron triggers) for a workflow."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    hook = db.query(Webhook).filter(Webhook.workflow_id == workflow_id).first()
    cron = db.query(CronTrigger).filter(CronTrigger.workflow_id == workflow_id).first()
    
    return {
        "webhook": {
            "id": hook.id,
            "slug": hook.slug,
            "secret": hook.secret,
            "created_at": hook.created_at
        } if hook else None,
        "cron": {
            "id": cron.id,
            "cron_expression": cron.cron_expression,
            "timezone": cron.timezone,
            "next_run_at": cron.next_run_at,
            "is_active": cron.is_active
        } if cron else None
    }
