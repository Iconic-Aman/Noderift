import json
from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node
from core.llm_provider import chat_completion, extract_api_key, first_message_text


@register_node
class AiAgentNode(BaseNode):
    node_type = "ai_agent"
    display_name = "AI Agent"
    description = "Run an OpenAI-compatible agent step"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        api_key = extract_api_key(config)
        base_url = str(config.get("base_url") or "")
        model = str(config.get("model") or "")
        prompt = str(config.get("prompt") or "")
        system_prompt = str(config.get("system_prompt") or "You are a workflow automation agent.")
        temperature = float(config.get("temperature") or 0.7)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{prompt}\n\nWorkflow input:\n{json.dumps(inputs.data, default=str)}"},
        ]
        response = await chat_completion(
            api_key=api_key,
            base_url=base_url,
            model=model,
            messages=messages,
            temperature=temperature,
        )
        return NodeOutput(data={"text": first_message_text(response), "raw": response})
