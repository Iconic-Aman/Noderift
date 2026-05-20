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
    
    redis_client = aioredis.from_url(settings.REDIS_URL or "redis://localhost:6379/0")
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
            # Yield control to prevent blocking/event loop starvation
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
