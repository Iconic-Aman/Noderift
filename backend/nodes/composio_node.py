import os
from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node


@register_node
class ComposioNode(BaseNode):
    node_type = "composio"
    display_name = "Composio"
    description = "Execute integration actions via Composio"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        try:
            from composio import Composio
        except ImportError:
            raise RuntimeError("composio not installed. Run: pip install composio-core")

        api_key = config.get("_composio_api_key") or os.environ.get("COMPOSIO_API_KEY", "")
        if not api_key:
            raise ValueError("COMPOSIO_API_KEY not set and no credential bound")

        app = config.get("app", "").strip()
        action = config.get("action", "").strip()
        parameters = config.get("parameters", {})
        user_id = config.get("user_id", inputs.data.get("user_id", "default"))

        if not app or not action:
            raise ValueError("app and action are required for Composio node")

        if isinstance(parameters, str):
            import json
            parameters = json.loads(parameters)

        client = Composio(api_key=api_key)
        result = client.actions.execute(
            action_name=action,
            user_id=user_id,
            params=parameters,
        )

        return NodeOutput(data={"result": result})
