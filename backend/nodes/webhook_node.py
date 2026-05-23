from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node
from typing import Dict, Any

@register_node
class WebhookNode(BaseNode):
    node_type = "webhook"
    display_name = "Webhook"
    description = "Trigger workflow via HTTP webhook"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        # Just return input payload which dag_runner injects into inputs.data
        return NodeOutput(data={
            "body": inputs.data.get("body", {}),
            "headers": inputs.data.get("headers", {}),
            "query": inputs.data.get("query", {})
        })
