from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict
from nodes import get_node_class, NodeInput

router = APIRouter(prefix="/nodes", tags=["nodes"])


class NodeTestRequest(BaseModel):
    node_type: str
    config: Dict[str, Any] = {}
    inputs: Dict[str, Any] = {}


@router.post("/test")
async def test_node(body: NodeTestRequest):
    """Execute a single node with mock input. Returns output or error."""
    node_cls = get_node_class(body.node_type)
    node = node_cls()
    try:
        result = await node.execute(NodeInput(data=body.inputs), body.config)
        return {"status": "success", "output": result.data}
    except StopIteration as e:
        return {"status": "skipped", "reason": str(e)}
    except Exception as e:
        return {"status": "error", "error": str(e)}
