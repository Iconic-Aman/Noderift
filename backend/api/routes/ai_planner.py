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
from ai.planner.chat_router import route_message
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
    """Run the AI Planner — routes through 8B chat model first, 70B builder only if needed."""
    workflow = db.query(Workflow).filter(Workflow.id == req.session_id, Workflow.user_id == user.id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    raw_history = await get_session_messages(req.session_id)
    history = [
        m for m in raw_history
        if m.__class__.__name__ == "HumanMessage"
        or (m.__class__.__name__ == "AIMessage" and not getattr(m, "tool_calls", None))
    ]

    try:
        from langchain_core.messages import HumanMessage, AIMessage

        # Step 1: Route through lightweight 8B model
        chat_reply, should_build = await route_message(req.message, history)

        if not should_build:
            # 8B handled it — save and return directly, no heavy model needed
            clean_history = list(history) + [
                HumanMessage(content=req.message),
                AIMessage(content=chat_reply),
            ]
            await save_session_messages(req.session_id, clean_history)
            return PlanResponse(reply=chat_reply, session_id=req.session_id)

        # Step 2: BUILD_REQUEST — run heavy 70B agent loop
        agent = get_planner_agent()
        reply, final_messages = await run_agent_loop(
            agent=agent,
            user_prompt=req.message,
            history=history,
            session_id=req.session_id,
            db=db,
        )
        clean_history = list(history) + [
            HumanMessage(content=req.message),
            AIMessage(content=reply),
        ]
        await save_session_messages(req.session_id, clean_history)
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
            # Ignore internal harness correction prompts
            if "Your previous output had the following issue:" in msg.content:
                continue
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
    from ai.planner.session import register_session_websocket, unregister_session_websocket
    register_session_websocket(session_id, websocket)
    logger.info(f"AI Planner WebSocket client connected to session {session_id}")

    try:
        while True:
            # Keep connection alive for server-sent events
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        logger.info(f"AI Planner WebSocket client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"AI Planner WebSocket error: {str(e)}")
    finally:
        unregister_session_websocket(session_id, websocket)
