import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import redis
import redis.asyncio as aioredis
from core.config import settings
import logging

router = APIRouter(prefix="/ws", tags=["websockets"])
logger = logging.getLogger(__name__)

@router.websocket("/executions/{execution_id}/logs")
async def websocket_execution_logs(websocket: WebSocket, execution_id: str):
    """WebSocket endpoint to subscribe to execution pub/sub logs."""
    await websocket.accept()

    # Replay stored logs from database to handle race conditions
    from core.database import SessionLocal
    from models.execution import Execution
    from models.node_log import NodeLog
    import json

    db = SessionLocal()
    try:
        execution = db.query(Execution).filter(Execution.id == execution_id).first()
        if execution:
            await websocket.send_text(json.dumps({
                "type": "workflow_started",
                "execution_id": execution_id,
                "timestamp": execution.started_at.isoformat() if execution.started_at else "",
            }))
            node_logs = db.query(NodeLog).filter(NodeLog.execution_id == execution_id).order_by(NodeLog.started_at).all()
            for log in node_logs:
                await websocket.send_text(json.dumps({
                    "type": "node_success" if log.status == "success" else "node_failed",
                    "execution_id": execution_id,
                    "node_id": log.node_id,
                    "duration_ms": log.duration_ms,
                    "output": log.output_data,
                    "error": log.error,
                    "timestamp": log.finished_at.isoformat() if log.finished_at else "",
                }))
            if execution.status in ("success", "failed", "needs_auth"):
                await websocket.send_text(json.dumps({
                    "type": "workflow_success" if execution.status == "success" else "needs_auth" if execution.status == "needs_auth" else "workflow_failed",
                    "execution_id": execution_id,
                    "error": execution.error,
                    "timestamp": execution.finished_at.isoformat() if execution.finished_at else "",
                }))
    except Exception as e:
        logger.error(f"Error replaying DB execution logs: {e}")
    finally:
        db.close()

    redis_client = aioredis.from_url(settings.REDIS_URL)
    pubsub = redis_client.pubsub()
    channel = f"execution:{execution_id}:logs"

    await pubsub.subscribe(channel)
    logger.info(f"WebSocket client subscribed to {channel}")

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
        logger.info(f"WebSocket client disconnected from {channel}")
    except Exception as e:
        logger.error(f"WebSocket execution log error: {str(e)}")
    finally:
        try:
            await pubsub.unsubscribe(channel)
        except Exception:
            pass
        await redis_client.close()
