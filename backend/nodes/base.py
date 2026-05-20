from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import Any, Dict

class NodeInput(BaseModel):
    data: Dict[str, Any]

class NodeOutput(BaseModel):
    data: Dict[str, Any]

class BaseNode(ABC):
    node_type: str          # e.g. "http_request"
    display_name: str       # e.g. "HTTP Request"
    description: str
    
    @abstractmethod
    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        """
        Execute node logic.
        inputs: Data passed from parent nodes.
        config: Node-specific settings (e.g. url, code, method).
        """
        pass
