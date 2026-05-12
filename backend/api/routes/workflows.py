from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from core.database import get_db
from api.deps import get_current_user
from models.user import User
from models.workflow import Workflow
from schemas.workflow import WorkflowCreate, WorkflowUpdate, Workflow as WorkflowSchema, WorkflowShort

router = APIRouter(prefix="/workflows", tags=["workflows"])


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


@router.patch("/{workflow_id}", response_model=WorkflowSchema)
def update_workflow(workflow_id: str, body: WorkflowUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Partial update — name, description, graph, or is_active."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == current_user.id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(wf, field, value)
    wf.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(wf)
    return wf


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
