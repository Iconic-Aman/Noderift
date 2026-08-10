import json
import redis.asyncio as redis
from sqlalchemy.orm import Session
from core.config import settings
from models.workflow import Workflow

from typing import Dict, Set
from fastapi import WebSocket

_ACTIVE_WEBSOCKETS: Dict[str, Set[WebSocket]] = {}


def register_session_websocket(session_id: str, ws: WebSocket):
    if session_id not in _ACTIVE_WEBSOCKETS:
        _ACTIVE_WEBSOCKETS[session_id] = set()
    _ACTIVE_WEBSOCKETS[session_id].add(ws)


def unregister_session_websocket(session_id: str, ws: WebSocket):
    if session_id in _ACTIVE_WEBSOCKETS:
        _ACTIVE_WEBSOCKETS[session_id].discard(ws)
        if not _ACTIVE_WEBSOCKETS[session_id]:
            del _ACTIVE_WEBSOCKETS[session_id]


async def emit_canvas_patch(session_id: str, event_type: str, payload: dict):
    """Publish graph changes to in-memory WebSockets and Redis."""
    message_str = json.dumps({"type": event_type, "payload": payload})

    # Direct in-memory broadcast to connected WebSockets
    connections = list(_ACTIVE_WEBSOCKETS.get(session_id, []))
    for ws in connections:
        try:
            await ws.send_text(message_str)
        except Exception:
            unregister_session_websocket(session_id, ws)

    # Optional Redis broadcast
    if settings.REDIS_URL:
        try:
            async with redis.from_url(settings.REDIS_URL) as r:
                await r.publish(f"ai_plan:{session_id}", message_str)
        except Exception:
            pass

def get_session_graph(db: Session, session_id: str) -> dict:
    """Retrieve the current graph from the workflow database."""
    workflow = db.query(Workflow).filter(Workflow.id == session_id).first()
    if not workflow:
        return {"nodes": [], "edges": []}
    return workflow.graph or {"nodes": [], "edges": []}

async def patch_graph(db: Session, session_id: str, action: str, payload: dict):
    """Mutate workflow graph in database and emit patch event."""
    workflow = db.query(Workflow).filter(Workflow.id == session_id).first()
    if not workflow:
        return

    # Work on a copy of the graph
    graph = dict(workflow.graph) if workflow.graph else {"nodes": [], "edges": []}
    if "nodes" not in graph:
        graph["nodes"] = []
    if "edges" not in graph:
        graph["edges"] = []

    if action == "add_node":
        graph["nodes"].append(payload)
        event = "node_added"
    elif action == "add_edge":
        graph["edges"].append(payload)
        event = "edge_added"
    elif action == "update_node":
        node_id = payload.get("id")
        for n in graph["nodes"]:
            if n.get("id") == node_id:
                # Merge config
                current_data = n.get("data", {})
                current_config = current_data.get("config", {})
                new_config = payload.get("config", {})
                current_data["config"] = {**current_config, **new_config}
                n["data"] = current_data
                break
        event = "node_updated"
    elif action == "remove_node":
        node_id = payload.get("id")
        graph["nodes"] = [n for n in graph["nodes"] if n.get("id") != node_id]
        graph["edges"] = [e for e in graph["edges"] if e.get("source") != node_id and e.get("target") != node_id]
        event = "node_removed"
    elif action == "clear":
        graph = {"nodes": [], "edges": []}
        event = "clear"
    else:
        return

    # Update database
    workflow.graph = graph
    db.add(workflow)
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(workflow, "graph")
    db.commit()

    # Emit to WebSocket clients
    await emit_canvas_patch(session_id, event, payload)

from langchain_core.messages import messages_to_dict, messages_from_dict

async def get_session_messages(session_id: str) -> list:
    """Retrieve message history for this session from Redis."""
    if not settings.REDIS_URL:
        return []
    try:
        async with redis.from_url(settings.REDIS_URL) as r:
            data = await r.get(f"ai_session_messages:{session_id}")
            if not data:
                return []
            raw_msgs = json.loads(data)
            return messages_from_dict(raw_msgs)
    except Exception:
        return []

async def save_session_messages(session_id: str, messages: list):
    """Save message history for this session to Redis."""
    if not settings.REDIS_URL:
        return
    try:
        serializable = messages_to_dict(messages)
        async with redis.from_url(settings.REDIS_URL) as r:
            await r.setex(
                f"ai_session_messages:{session_id}",
                86400,
                json.dumps(serializable)
            )
    except Exception:
        pass

