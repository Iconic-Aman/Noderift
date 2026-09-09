from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from api.deps import get_current_user
from core.database import get_db
from models.ai_chat import AIChatMessage, AIChatSession
from models.user import User
from models.workflow import Workflow
from schemas.ai_chat import AIChatMessageOut
from core.security import bearer_scheme

router = APIRouter(prefix="/workflows/{workflow_id}/ai", tags=["ai"])


def _get_workflow(db: Session, workflow_id: str, user_id: str) -> Workflow:
    from fastapi import HTTPException
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == user_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


def _session(db: Session, workflow_id: str, user_id: str) -> AIChatSession:
    session = db.query(AIChatSession).filter(AIChatSession.workflow_id == workflow_id, AIChatSession.user_id == user_id).first()
    if session:
        return session
    session = AIChatSession(workflow_id=workflow_id, user_id=user_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/messages", response_model=list[AIChatMessageOut], dependencies=[Depends(bearer_scheme)])
def list_messages(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_workflow(db, workflow_id, current_user.id)
    session = _session(db, workflow_id, current_user.id)
    return db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()
