from typing import Any, Dict, List
import httpx


def extract_api_key(data: Dict[str, Any]) -> str:
    for key in ("api_key", "provider_api_key", "nvidia_api_key", "openai_api_key", "key", "token", "access_token", "secret"):
        if data.get(key):
            return str(data[key])
    string_values = [v for v in data.values() if isinstance(v, str) and v.strip()]
    if len(string_values) == 1:
        return string_values[0]
    return ""


async def chat_completion(
    *,
    api_key: str,
    base_url: str,
    model: str,
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
) -> Dict[str, Any]:
    if not api_key:
        raise ValueError("Provider API key is required")
    if not base_url:
        raise ValueError("Provider base URL is required")
    if not model:
        raise ValueError("Model name is required")

    endpoint = f"{base_url.rstrip('/')}/chat/completions"
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                endpoint,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
            )
    except httpx.TimeoutException:
        raise RuntimeError("LLM provider timed out after 120 seconds. Check the base URL and model name.")

    try:
        data = response.json()
    except Exception:
        data = {"raw": response.text}

    if response.status_code >= 400:
        raise RuntimeError(f"LLM provider error {response.status_code}: {data}")
    return data


def first_message_text(response: Dict[str, Any]) -> str:
    choices = response.get("choices") or []
    if not choices:
        return ""
    message = choices[0].get("message") or {}
    return str(message.get("content") or "")
