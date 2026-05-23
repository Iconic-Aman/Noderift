import httpx
from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node

import re

def resolve_template(text: str, inputs_data: dict) -> str:
    if not isinstance(text, str):
        return text

    def replace_match(match):
        expr = match.group(1).strip()
        parts = expr.split(".")
        
        # Try to resolve from _upstream
        upstream = inputs_data.get("_upstream", {})
        if parts[0] in upstream:
            curr = upstream[parts[0]]
            for part in parts[1:]:
                if isinstance(curr, dict) and part in curr:
                    curr = curr[part]
                else:
                    return match.group(0)
            return str(curr)

        # Try to resolve directly from inputs_data
        curr = inputs_data
        for part in parts:
            if isinstance(curr, dict) and part in curr:
                curr = curr[part]
            else:
                return match.group(0)
        return str(curr)

    text = re.sub(r"\{\{([^}]+)\}\}", replace_match, text)
    text = re.sub(r"\{([^}]+)\}", replace_match, text)
    return text

def resolve_value(val: Any, inputs_data: dict) -> Any:
    if isinstance(val, str):
        return resolve_template(val, inputs_data)
    elif isinstance(val, dict):
        return {k: resolve_value(v, inputs_data) for k, v in val.items()}
    elif isinstance(val, list):
        return [resolve_value(v, inputs_data) for v in val]
    return val

@register_node
class HttpRequestNode(BaseNode):
    node_type = "http_request"
    display_name = "HTTP Request"
    description = "Make an HTTP request to any external API"

    async def execute(self, inputs: NodeInput, config: Dict[str, Any]) -> NodeOutput:
        url = config.get("url", "").strip()
        method = config.get("method", "GET").upper()
        headers = config.get("headers", {})
        body = config.get("body", None)
        params = config.get("params", {})

        if not url:
            raise ValueError("URL is required for HTTP Request node")

        # Resolve templated expressions recursively from input data
        if inputs.data:
            try:
                url = resolve_value(url, inputs.data)
                params = resolve_value(params, inputs.data)
                headers = resolve_value(headers, inputs.data)
                body = resolve_value(body, inputs.data)
            except Exception:
                pass

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Determine content type / body format
            if isinstance(body, dict):
                response = await client.request(method, url, json=body, headers=headers, params=params)
            elif isinstance(body, str):
                response = await client.request(method, url, content=body, headers=headers, params=params)
            else:
                response = await client.request(method, url, headers=headers, params=params)

        # Parse JSON if possible
        try:
            response_data = response.json()
        except Exception:
            response_data = response.text

        return NodeOutput(
            data={
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "response": response_data,
            }
        )
