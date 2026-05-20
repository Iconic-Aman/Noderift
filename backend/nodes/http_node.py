import httpx
from typing import Any, Dict
from nodes.base import BaseNode, NodeInput, NodeOutput
from nodes import register_node

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

        # Support templating or string format with inputs if keys match
        # e.g., if url contains {variable}, format it using inputs.data
        if inputs.data:
            try:
                url = url.format(**inputs.data)
                # Formats query params too if they are strings
                params = {k: (v.format(**inputs.data) if isinstance(v, str) else v) for k, v in params.items()}
                # Format headers
                headers = {k: (v.format(**inputs.data) if isinstance(v, str) else v) for k, v in headers.items()}
                # Format body if it is string
                if isinstance(body, str):
                    body = body.format(**inputs.data)
            except Exception as e:
                # Fallback to original if formatting fails
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
