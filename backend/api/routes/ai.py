from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import json

from api.deps import get_current_user
from core.config import settings
from core.database import get_db
from core.llm_provider import chat_completion, extract_api_key, first_message_text
from models.ai_chat import AIChatMessage, AIChatSession
from models.credential import Credential
from models.user import User
from models.workflow import Workflow
from schemas.ai_chat import AIChatRequest, AIChatResponse, AIChatMessageOut

router = APIRouter(prefix="/workflows/{workflow_id}/ai", tags=["ai"])


def _get_workflow(db: Session, workflow_id: str, user_id: str) -> Workflow:
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


def _credential_data(db: Session, credential_id: str, user_id: str) -> dict:
    cred = db.query(Credential).filter(Credential.id == credential_id, Credential.user_id == user_id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    fernet = Fernet(settings.SECRET_KEY.encode())
    return json.loads(fernet.decrypt(cred.encrypted_data.encode()).decode())


@router.get("/messages", response_model=list[AIChatMessageOut])
def list_messages(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _get_workflow(db, workflow_id, current_user.id)
    session = _session(db, workflow_id, current_user.id)
    return db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()


@router.post("/chat", response_model=AIChatResponse)
async def chat(workflow_id: str, body: AIChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workflow = _get_workflow(db, workflow_id, current_user.id)
    session = _session(db, workflow_id, current_user.id)
    db.add(AIChatMessage(session_id=session.id, role="user", content=body.message))
    db.commit()

    history = db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()
    key = extract_api_key(_credential_data(db, body.credential_id, current_user.id))
    messages = [{
        "role": "system",
        "content": f"You help build Noderift workflows. Propose nodes and edges, but do not execute actions. Current graph: {json.dumps(workflow.graph, default=str)}",
    }]
    messages += [{"role": m.role, "content": m.content} for m in history[-12:]]

    response = await chat_completion(api_key=key, base_url=body.base_url, model=body.model, messages=messages, temperature=body.temperature)
    assistant = AIChatMessage(session_id=session.id, role="assistant", content=first_message_text(response), meta={"raw": response})
    db.add(assistant)
    db.commit()
    db.refresh(assistant)

    updated = db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()
    return {"message": assistant, "proposal": None, "history": updated}
