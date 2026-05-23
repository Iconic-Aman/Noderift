from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from core.database import get_db
from api.deps import get_current_user
from models.user import User
from models.workflow import Workflow
from models.execution import Execution
from models.node_log import NodeLog
from schemas.execution import ExecutionResponse, ExecutionDetailResponse
from core.security import bearer_scheme

router = APIRouter(
    prefix="/executions",
    tags=["executions"],
    dependencies=[Depends(bearer_scheme)]
)

@router.post("/{workflow_id}", response_model=ExecutionResponse, status_code=201)
def trigger_execution(
    workflow_id: str,
    target_node_id: str = None,
    triggered_by: str = "manual",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trigger a workflow execution. Enqueues a Celery task."""
    # Verify workflow exists and belongs to user
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Create Execution record
    execution = Execution(
        workflow_id=workflow_id,
        status="pending",
        triggered_by=triggered_by,
        started_at=datetime.now(timezone.utc)
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    try:
        from core.celery_app import celery_app
        celery_app.send_task("worker.run_workflow_task", args=[execution.id, target_node_id])
    except Exception as e:
        # If queue fails, mark execution as failed instantly
        execution.status = "failed"
        execution.error = f"Failed to enqueue task: {str(e)}"
        execution.finished_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(execution)

    return execution

@router.get("/{workflow_id}/history", response_model=List[ExecutionResponse])
def get_execution_history(
    workflow_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all execution runs for a workflow."""
    # Verify ownership
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    executions = db.query(Execution).filter(
        Execution.workflow_id == workflow_id
    ).order_by(Execution.started_at.desc()).all()

    return executions

@router.get("/detail/{execution_id}", response_model=ExecutionDetailResponse)
def get_execution_detail(
    execution_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full execution status and node logs."""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    # Verify workflow ownership
    wf = db.query(Workflow).filter(Workflow.id == execution.workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Fetch ordered logs
    node_logs = db.query(NodeLog).filter(
        NodeLog.execution_id == execution_id
    ).order_by(NodeLog.started_at.asc()).all()

    # Dynamic attribute matching for detail schema
    execution.node_logs = node_logs
    return execution
