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
            from composio import Action, Composio
        except ImportError:
            raise RuntimeError("composio not installed. Run: pip install composio-core")

        api_key = config.get("_composio_api_key") or os.environ.get("COMPOSIO_API_KEY", "")
        if not api_key:
            raise ValueError("COMPOSIO_API_KEY not set and no credential bound")

        action = config.get("action", "").strip()
        parameters = config.get("parameters", {})
        user_id = config.get("user_id", inputs.data.get("user_id", "default"))

        if not action:
            raise ValueError("action is required for Composio node")

        if isinstance(parameters, str):
            import json
            parameters = json.loads(parameters) if parameters.strip() else {}

        parameters = {
            **{k: v for k, v in {
                "to": config.get("to"),
                "subject": config.get("subject"),
                "body": config.get("body"),
                "channel": config.get("channel"),
                "text": config.get("message"),
            }.items() if v},
            **parameters,
        }

        client = Composio(api_key=api_key)
        composio_action = getattr(Action, action, None)
        if composio_action is None:
            raise ValueError(f"Unknown Composio action: {action}")

        result = client.actions.execute(
            composio_action,
            params=parameters,
            entity_id=user_id,
        )

        return NodeOutput(data={"result": result})
