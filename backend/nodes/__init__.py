from nodes.base import BaseNode, NodeInput, NodeOutput

class PassThroughNode(BaseNode):
    node_type = "passthrough"
    display_name = "Pass Through"
    description = "Passes inputs directly to outputs"
    async def execute(self, inputs: NodeInput, config: dict) -> NodeOutput:
        return NodeOutput(data={"inputs": inputs.data, "config": config.get("config", {})})

NODE_REGISTRY = {}

def register_node(node_cls):
    NODE_REGISTRY[node_cls.node_type] = node_cls
    return node_cls

def get_node_class(node_type: str):
    if node_type not in NODE_REGISTRY:
        return PassThroughNode
    return NODE_REGISTRY[node_type]

# Import nodes to trigger decorators
from nodes.http_node import HttpRequestNode
from nodes.code_node import CodeNode
