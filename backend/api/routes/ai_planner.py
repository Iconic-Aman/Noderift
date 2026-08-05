import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
import redis.asyncio as aioredis

from api.deps import get_current_user
from core.config import settings
from core.database import get_db
from models.user import User
from models.workflow import Workflow
from ai.planner.agent import get_planner_agent
from ai.planner.loop import run_agent_loop
from ai.planner.session import get_session_messages, save_session_messages
from core.security import bearer_scheme

router = APIRouter(prefix="/ai", tags=["AI Planner"])
logger = logging.getLogger("uvicorn")

class PlanRequest(BaseModel):
    message: str
    session_id: str

class PlanResponse(BaseModel):
    reply: str
    session_id: str

@router.post("/plan", response_model=PlanResponse, dependencies=[Depends(bearer_scheme)])
async def plan_workflow(req: PlanRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Run the AI Planner ReAct agent on a workflow."""
    # Verify workflow exists and belongs to user
    workflow = db.query(Workflow).filter(Workflow.id == req.session_id, Workflow.user_id == user.id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Load conversation history for this session
    history = await get_session_messages(req.session_id)

    try:
        agent = get_planner_agent()
        reply, final_messages = await run_agent_loop(
            agent=agent,
            user_prompt=req.message,
            history=history,
            session_id=req.session_id,
            db=db,
        )
        await save_session_messages(req.session_id, final_messages)
        return PlanResponse(reply=reply, session_id=req.session_id)
    except Exception as e:
        logger.error(f"AI Planner execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plan/{session_id}/messages", dependencies=[Depends(bearer_scheme)])
async def get_messages(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Retrieve formatted conversation messages for the AI Planner session."""
    workflow = db.query(Workflow).filter(Workflow.id == session_id, Workflow.user_id == user.id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    history = await get_session_messages(session_id)
    formatted = []
    for idx, msg in enumerate(history):
        role = "assistant"
        if getattr(msg, "type", "") == "human":
            role = "user"
        elif getattr(msg, "type", "") == "ai":
            role = "assistant"
        else:
            continue
        formatted.append({
            "id": f"msg-{idx}",
            "role": role,
            "content": msg.content
        })
    return formatted


@router.websocket("/ws/plan/{session_id}")
async def websocket_ai_plan(websocket: WebSocket, session_id: str):
    """WebSocket endpoint to subscribe to real-time canvas patch events."""
    await websocket.accept()
    
    redis_client = aioredis.from_url(settings.REDIS_URL)
    pubsub = redis_client.pubsub()
    channel = f"ai_plan:{session_id}"
    
    await pubsub.subscribe(channel)
    logger.info(f"AI Planner WebSocket client subscribed to {channel}")
    
    try:
        while True:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                data = message["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                await websocket.send_text(data)
            await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        logger.info(f"AI Planner WebSocket client disconnected from {channel}")
    except Exception as e:
        logger.error(f"AI Planner WebSocket error: {str(e)}")
    finally:
        try:
            await pubsub.unsubscribe(channel)
        except Exception:
            pass
        await redis_client.close()
