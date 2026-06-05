from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from cryptography.fernet import Fernet
import json
import re

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


def _proposal_from_text(text: str):
    # 1. Try to find all markdown JSON blocks
    fenced_blocks = re.findall(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced_blocks:
        for block in reversed(fenced_blocks):
            try:
                parsed = json.loads(re.sub(r"(?<!:)\/\/.*", "", block).strip())
                if "proposal" in parsed or "nodes" in parsed:
                    proposal = parsed.get("proposal") if "proposal" in parsed else parsed
                    return proposal, parsed.get("message", text)
            except Exception:
                continue

    # 2. Try parsing raw JSON objects from the text
    candidates = []
    for match in re.finditer(r"\{", text):
        start = match.start()
        for end in range(len(text), start, -1):
            substring = text[start:end]
            if substring.count("{") == substring.count("}"):
                candidates.append(substring)
                break

    # Parse candidates from last (newest/most specific) to first
    for cand in reversed(candidates):
        try:
            cleaned = re.sub(r"(?<!:)\/\/.*", "", cand).strip()
            parsed = json.loads(cleaned)
            if "proposal" in parsed or "nodes" in parsed:
                proposal = parsed.get("proposal") if "proposal" in parsed else parsed
                return proposal, parsed.get("message", text)
        except Exception:
            continue

    # Fallback to original parsing method
    raw = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if fenced:
        raw = fenced.group(1)
    elif "{" in raw and "}" in raw:
        raw = raw[raw.find("{"):raw.rfind("}") + 1]
    raw = re.sub(r"(?<!:)\/\/.*", "", raw)
    try:
        parsed = json.loads(raw.strip())
        return parsed.get("proposal"), parsed.get("message", text)
    except Exception:
        return None, text




def _fallback_proposal(message: str):
    lower = message.lower()
    url_match = re.search(r"https?://\S+", message)
    email_match = re.search(r"[\w.+-]+@[\w.-]+\.\w+", message)
    if not (url_match and email_match and ("mail" in lower or "email" in lower)):
        return None
    
    time_match = re.search(r"(?:at|every)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", lower)
    hour = 17
    minute = 0
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        ampm = time_match.group(3)
        if ampm == "pm" and hour != 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
            
    # Use IST timezone so cron fires at user's local time
    timezone = "Asia/Kolkata"
    joke_html = (
        "<h2>Your Daily Joke 😄</h2>"
        "<p>{{response.joke}}</p>"
        "<p><em>{{response.setup}}</em><br><strong>{{response.delivery}}</strong></p>"
        "<hr><p style='color:#888;font-size:12px'>Powered by Noderift</p>"
    )
    return {
        "nodes": [
            {"id": "schedule-1", "type": "schedule", "config": {"cron": f"{minute} {hour} * * *", "timezone": timezone, "frequency": "daily", "time": f"{hour:02d}:{minute:02d}"}},
            {"id": "http-1", "type": "http", "config": {"url": url_match.group(0), "method": "GET", "headers": {}, "body": {}}},
            {"id": "resend-1", "type": "resend", "config": {"from": "onboarding@resend.dev", "to": email_match.group(0), "subject": "Your Daily Joke 😄", "html": joke_html, "credential_id": ""}},
        ],
        "edges": [
            {"source": "schedule-1", "target": "http-1"},
            {"source": "http-1", "target": "resend-1"},
        ],
    }


def _sanitize_proposal(proposal, message: str):
    fallback = _fallback_proposal(message)
    if fallback and (not proposal or len(proposal.get("nodes", [])) < 3):
        return fallback
    if not proposal:
        return None
    node_ids = {node.get("id") for node in proposal.get("nodes", [])}
    proposal["edges"] = [
        edge for edge in proposal.get("edges", [])
        if edge.get("source") in node_ids and edge.get("target") in node_ids and edge.get("source") != edge.get("target")
    ]
    return proposal


@router.get("/messages", response_model=list[AIChatMessageOut])
def list_messages(workflow_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    
    _get_workflow(db, workflow_id, current_user.id)
    session = _session(db, workflow_id, current_user.id)
    return db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()


from core.embeddings import get_embedding
from models.node_vector import NodeEmbedding, WorkflowExampleEmbedding
import logging

logger = logging.getLogger("uvicorn")

@router.post("/chat", response_model=AIChatResponse)
async def chat(workflow_id: str, body: AIChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workflow = _get_workflow(db, workflow_id, current_user.id)
    session = _session(db, workflow_id, current_user.id)
    db.add(AIChatMessage(session_id=session.id, role="user", content=body.message))
    db.commit()

    history = db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()
    
    key = settings.NVIDIA_API_KEY
    base_url = settings.NVIDIA_API_URL
    model = settings.LLM_MODEL

    if not key and body.credential_id:
        key = extract_api_key(_credential_data(db, body.credential_id, current_user.id))
    if not base_url and body.base_url:
        base_url = body.base_url
    if not model and body.model:
        model = body.model

    if not key or not base_url or not model:
        raise HTTPException(status_code=400, detail="Missing required NVIDIA LLM configurations.")

    graph = body.current_graph or workflow.graph
    
    # RAG: Search relevant nodes and workflow examples
    catalog_list = []
    examples_list = []
    try:
        query_vector = await get_embedding(body.message, input_type="query")
        
        # 1. Match node schemas
        matched_nodes = db.query(NodeEmbedding).order_by(
            NodeEmbedding.embedding.cosine_distance(query_vector)
        ).limit(3).all()
        catalog_list = [node.schema_json for node in matched_nodes]
        logger.info(f"RAG Matched Nodes: {[n.node_type for n in matched_nodes]}")
        
        # 2. Match workflow examples
        matched_examples = db.query(WorkflowExampleEmbedding).order_by(
            WorkflowExampleEmbedding.embedding.cosine_distance(query_vector)
        ).limit(2).all()
        examples_list = [
            {
                "name": ex.name,
                "description": ex.description,
                "workflow_json": ex.workflow_json
            }
            for ex in matched_examples
        ]
        logger.info(f"RAG Matched Examples: {[e.name for e in matched_examples]}")

    except Exception as e:
        logger.error(f"RAG similarity search failed: {e}")

    if not catalog_list:
        catalog_list = body.node_catalog

    catalog = json.dumps(catalog_list, default=str)
    examples = json.dumps(examples_list, default=str) if examples_list else "[]"
    messages = [{
        "role": "system",
        "content": (
            "You are an AI assistant that designs and modifies Noderift workflow graphs. "
            "You must output only a precise JSON patch containing the nodes and edges to be added or modified. "
            "Only use nodes listed in NODE_CATALOG. "
            "CRITICAL: When configuring the 'schedule' node, you MUST write a valid 5-field cron expression in standard format: (minute hour day_of_month month day_of_week). "
            "Example: 'every monday 10:44 AM' must be '44 10 * * 1' or '44 10 * * MON'. "
            "Return strict JSON: {\"message\":\"...\",\"proposal\":{\"nodes\":[{\"id\":\"node-id\",\"type\":\"type\",\"config\":{}}],\"edges\":[{\"source\":\"source-id\",\"target\":\"target-id\"}]}}. "
            f"NODE_CATALOG: {catalog}. "
            f"WORKFLOW_EXAMPLES: {examples}. "
            f"CURRENT_GRAPH: {json.dumps(graph, default=str)}"
        ),
    }]

    messages += [{"role": m.role, "content": m.content} for m in history[-12:]]

    response = await chat_completion(api_key=key, base_url=base_url, model=model, messages=messages, temperature=body.temperature)
    proposal, text = _proposal_from_text(first_message_text(response))
    proposal = _sanitize_proposal(proposal, body.message)
    assistant = AIChatMessage(session_id=session.id, role="assistant", content=text, meta={"raw": response, "proposal": proposal})
    db.add(assistant)
    db.commit()
    db.refresh(assistant)

    updated = db.query(AIChatMessage).filter(AIChatMessage.session_id == session.id).order_by(AIChatMessage.created_at.asc()).all()
    return {"message": assistant, "proposal": proposal, "history": updated}

