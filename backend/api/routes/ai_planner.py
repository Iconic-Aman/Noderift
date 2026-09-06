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
import json
from cryptography.fernet import Fernet
from models.credential import Credential

_fernet = Fernet(settings.SECRET_KEY.encode())

_PROVIDER_DEFAULTS = {
    "openrouter": {
        "base_url": settings.OPENROUTER_API_URL or "https://openrouter.ai/api/v1",
        "model": settings.OPENROUTER_MODEL or settings.OPENROUTER_MODEL1 or "openrouter/free"
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.1-8b-instant",
    },
}

def _get_llm_credential(db: Session, user_id: str) -> dict | None:
    """Fetch and decrypt the user's saved LLM API key from DB, fallback to settings."""
    cred = db.query(Credential).filter(
        Credential.user_id == user_id,
        Credential.name == "llm_key",
        Credential.type == "api_key",
    ).first()
    if cred:
        try:
            return json.loads(_fernet.decrypt(cred.encrypted_data.encode()).decode())
        except Exception:
            pass

    # Cloud fallback to env vars if configured
    if settings.OPENROUTER_API_KEY:
        return {
            "api_key": settings.OPENROUTER_API_KEY,
            "base_url": settings.OPENROUTER_API_URL or "https://openrouter.ai/api/v1",
            "model": settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct",
            "provider": "openrouter",
        }
    return None

def _is_quota_or_key_error(exc: Exception) -> bool:
    """Check if exception indicates quota exceeded, rate limit, or invalid key."""
    err_msg = str(exc).lower()
    status_code = getattr(exc, "status_code", None) or getattr(exc, "code", None)
    if status_code in (401, 402, 429):
        return True
    keywords = [
        "rate limit", "rate_limit", "quota", "credit", "exceeded", "balance",
        "429", "402", "insufficient", "too many requests", "payment required",
        "key invalid", "invalid api key", "unauthorized"
    ]
    return any(k in err_msg for k in keywords)


class PlanRequest(BaseModel):
    message: str
    session_id: str

class PlanResponse(BaseModel):
    reply: str
    session_id: str
    is_build: bool = False

@router.get("/llm-key-status", dependencies=[Depends(bearer_scheme)])
def llm_key_status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Check if LLM API key is configured (either in DB or environment)."""
    cred_data = _get_llm_credential(db, user.id)
    env_keys = settings.get_openrouter_keys()
    configured = cred_data is not None or len(env_keys) > 0
    provider = "openrouter"
    model = settings.OPENROUTER_MODEL or "meta-llama/llama-3.3-70b-instruct"
    masked_key = ""

    if cred_data:
        provider = cred_data.get("provider", "openrouter")
        model = cred_data.get("model") or model
        raw_key = cred_data.get("api_key", "")
        if raw_key:
            masked_key = (raw_key[:6] + "..." + raw_key[-4:]) if len(raw_key) > 10 else "••••••••"
    elif env_keys:
        primary = env_keys[0]
        masked_key = (primary[:6] + "..." + primary[-4:]) if len(primary) > 10 else "••••••••"
        if len(env_keys) > 1:
            masked_key += f" (+{len(env_keys)-1} backup keys)"

    return {
        "configured": configured,
        "provider": provider,
        "model": model,
        "masked_key": masked_key,
    }

@router.post("/plan", response_model=PlanResponse, dependencies=[Depends(bearer_scheme)])
async def plan_workflow(req: PlanRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Run the AI Planner — builds workflows and saves history permanently."""
    workflow = db.query(Workflow).filter(Workflow.id == req.session_id, Workflow.user_id == user.id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Resolve LLM keys: user credential + env settings
    cred_data = _get_llm_credential(db, user.id)
    candidate_keys: list[str] = []
    if cred_data and cred_data.get("api_key"):
        candidate_keys.append(cred_data["api_key"].strip())

    for k in settings.get_openrouter_keys():
        if k and k.strip() and k.strip() not in candidate_keys:
            candidate_keys.append(k.strip())

    if not candidate_keys:
        raise HTTPException(status_code=428, detail="no_llm_key")

    import random
    keys_pool = list(candidate_keys)
    random.shuffle(keys_pool)

    provider = (cred_data.get("provider") if cred_data else None) or "openrouter"
    defaults = _PROVIDER_DEFAULTS.get(provider, _PROVIDER_DEFAULTS["openrouter"])
    base_url = (cred_data.get("base_url") if cred_data else None) or defaults["base_url"]

    # Candidate models in priority order:
    # 1. Custom model in user credential (if set)
    # 2. settings.OPENROUTER_MODEL
    # 3. settings.OPENROUTER_MODEL1
    # 4. settings.OPENROUTER_MODEL2
    # 5. settings.OPENROUTER_MODEL3
    candidate_models: list[str] = []
    if cred_data and cred_data.get("model") and cred_data["model"].strip():
        candidate_models.append(cred_data["model"].strip())

    for env_m in [
        getattr(settings, "OPENROUTER_MODEL", None),
        getattr(settings, "OPENROUTER_MODEL1", None),
        getattr(settings, "OPENROUTER_MODEL2", None),
        getattr(settings, "OPENROUTER_MODEL3", None),
    ]:
        if env_m and env_m.strip() and env_m.strip() not in candidate_models:
            candidate_models.append(env_m.strip())

    if not candidate_models:
        candidate_models = [defaults["model"]]

    primary_model = candidate_models[0]

    raw_history = await get_session_messages(req.session_id, db=db)
    history = [
        m for m in raw_history
        if m.__class__.__name__ == "HumanMessage"
        or (m.__class__.__name__ == "AIMessage" and not getattr(m, "tool_calls", None))
    ]

    logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    logger.info(f"[AI PLANNER] Request from: '{user.email or getattr(user, 'username', 'user')}'")
    logger.info(f"[AI PLANNER] Message: '{req.message[:120]}'")
    logger.info(f"[AI PLANNER] Session: {req.session_id} | Provider: '{provider}' | Available keys: {len(keys_pool)} | Models to try: {candidate_models}")
    logger.info(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

    try:
        from langchain_core.messages import HumanMessage, AIMessage

        # Immediately record user prompt so it never disappears on refresh
        history_with_user = list(history) + [HumanMessage(content=req.message)]
        await save_session_messages(req.session_id, history_with_user, db=db)

        # Step 1: Route through chat model (passes keys_pool for shuffled key try/fallback)
        logger.info(f"[AI PLANNER] STEP 1 → Calling chat_router.route_message()...")
        chat_reply, should_build = await route_message(req.message, history, keys_pool, base_url, primary_model)
        logger.info(f"[AI PLANNER] STEP 1 RESULT → should_build={should_build}, reply_preview='{chat_reply[:80] if chat_reply else 'N/A'}'")

        if not should_build:
            clean_history = list(history) + [
                HumanMessage(content=req.message),
                AIMessage(content=chat_reply),
            ]
            await save_session_messages(req.session_id, clean_history, db=db)
            return PlanResponse(reply=chat_reply, session_id=req.session_id, is_build=False)

        # Step 2: Build request — try candidate models in sequence with key rotation
        from ai.planner.guardrails import verify_graph
        from ai.planner.session import emit_canvas_patch

        workflow_built = False
        final_reply = ""

        for idx, current_model in enumerate(candidate_models):
            logger.info(f"🤖 [AI PLANNER] Attempt {idx + 1}/{len(candidate_models)} with Model: '{current_model}'")
            model_success = False

            while keys_pool:
                active_key = keys_pool[0]
                masked_k = (active_key[:6] + "..." + active_key[-4:]) if len(active_key) > 10 else "••••"
                logger.info(f"🔑 [AI PLANNER] Using key {masked_k} (remaining keys in pool: {len(keys_pool)})")
                try:
                    agent = get_planner_agent(api_key=active_key, base_url=base_url, model_name=current_model)
                    reply, final_messages = await run_agent_loop(
                        agent=agent,
                        user_prompt=req.message,
                        history=[],  # checkpointer manages state via thread_id; history arg unused
                        session_id=req.session_id,
                        db=db,
                        model_name=current_model,
                    )
                    guardrail_err = verify_graph(db, req.session_id, user_prompt=req.message)
                    if guardrail_err is None:
                        logger.info(f"✓ [AI PLANNER] Workflow successfully created with Model: '{current_model}'")
                        workflow_built = True
                        final_reply = reply
                        model_success = True
                        break
                    else:
                        logger.warning(f"⚠ [AI PLANNER] Model '{current_model}' guardrail check failed: {guardrail_err}")
                        if idx < len(candidate_models) - 1:
                            await emit_canvas_patch(req.session_id, "agent_step", {
                                "text": "Refining workflow with alternative model..."
                            })
                        break
                except Exception as model_exc:
                    logger.error(f"❌ [AI PLANNER] Model '{current_model}' error with key {masked_k}: {type(model_exc).__name__}: {model_exc}")
                    if _is_quota_or_key_error(model_exc) and len(keys_pool) > 1:
                        logger.warning(f"🔄 [AI PLANNER] Key {masked_k} quota/rate limit hit. Rotating to next key...")
                        keys_pool.pop(0)
                        await emit_canvas_patch(req.session_id, "agent_step", {
                            "text": "Quota or rate limit reached. Switching API key and retrying..."
                        })
                        continue
                    else:
                        if idx < len(candidate_models) - 1:
                            await emit_canvas_patch(req.session_id, "agent_step", {
                                "text": "Retrying with alternative model..."
                            })
                        break

            if model_success:
                break

        if not workflow_built:
            logger.warning(f"[AI PLANNER] All candidate models {candidate_models} failed for session {req.session_id}.")
            final_reply = "I couldn't generate the workflow right now. Please try again or rephrase your request."

        clean_history = list(history) + [
            HumanMessage(content=req.message),
            AIMessage(content=final_reply),
        ]
        await save_session_messages(req.session_id, clean_history, db=db)
        return PlanResponse(reply=final_reply, session_id=req.session_id, is_build=True)

    except Exception as e:
        logger.error(f"[AI PLANNER] ❌ EXCEPTION: {type(e).__name__}: {e}")
        fallback_reply = "I couldn't generate the workflow right now. Please try again or rephrase your request."
        try:
            from langchain_core.messages import HumanMessage, AIMessage
            clean_history = list(history) + [
                HumanMessage(content=req.message),
                AIMessage(content=fallback_reply),
            ]
            await save_session_messages(req.session_id, clean_history, db=db)
        except Exception:
            pass
        return PlanResponse(reply=fallback_reply, session_id=req.session_id, is_build=True)

@router.get("/plan/{session_id}/messages", dependencies=[Depends(bearer_scheme)])
async def get_messages(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Retrieve formatted conversation messages for the AI Planner session."""
    workflow = db.query(Workflow).filter(Workflow.id == session_id, Workflow.user_id == user.id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    history = await get_session_messages(session_id, db=db)
    formatted = []
    for idx, msg in enumerate(history):
        role = "assistant"
        if getattr(msg, "type", "") == "human":
            if "Your previous output had the following issue:" in getattr(msg, "content", ""):
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
            # Await client frames or clean disconnect signal
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info(f"AI Planner WebSocket client disconnected from session {session_id}")
    except Exception as e:
        logger.error(f"AI Planner WebSocket error: {str(e)}")
    finally:
        unregister_session_websocket(session_id, websocket)
