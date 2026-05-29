from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node


@register_node
class FilterNode(BaseNode):
    node_type = "filter"
    display_name = "Filter"
    description = "Branch based on condition"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        condition = config.get("condition", "True")
        try:
            result = bool(eval(condition, {"__builtins__": {}}, inputs.data))
        except Exception as e:
            raise ValueError(f"Filter condition error: {e}")
        if not result:
            raise StopIteration("Filter condition not met — branch skipped")
        return NodeOutput(data=inputs.data)


@register_node
class MergeNode(BaseNode):
    node_type = "merge"
    display_name = "Merge"
    description = "Merge multiple inputs"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        mode = config.get("mode", "combine")
        upstream = inputs.data.get("_upstream", {})
        if mode == "append":
            merged = list(upstream.values())
        else:
            merged = {}
            for v in upstream.values():
                if isinstance(v, dict):
                    merged.update(v)
        return NodeOutput(data={"merged": merged})


@register_node
class LoopNode(BaseNode):
    node_type = "loop"
    display_name = "Loop"
    description = "Iterate over items"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        items_key = config.get("items", "items")
        items = inputs.data.get(items_key, inputs.data.get("items", []))
        if not isinstance(items, list):
            items = [items]
        return NodeOutput(data={"items": items, "count": len(items)})


@register_node
class SetVariableNode(BaseNode):
    node_type = "set_variable"
    display_name = "Set Variable"
    description = "Store a value in execution state"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        name = config.get("name", "variable")
        value = config.get("value", "")
        return NodeOutput(data={**inputs.data, name: value})
