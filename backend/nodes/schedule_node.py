from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node
from datetime import datetime, timezone
from typing import Dict, Any

@register_node
class ScheduleNode(BaseNode):
    node_type = "schedule"
    display_name = "Schedule"
    description = "Run workflow on a schedule"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        return NodeOutput(data={
            "triggered_at": datetime.now(timezone.utc).isoformat(),
            "cron": config.get("cron", "* * * * *"),
            "timezone": config.get("timezone", "UTC")
        })
