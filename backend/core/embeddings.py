from typing import List
import logging
from openai import AsyncOpenAI
from core.config import settings

logger = logging.getLogger("uvicorn")

_client = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        key = settings.NVIDIA_API_KEY
        base_url = settings.NVIDIA_API_URL
        if not key:
            raise ValueError("NVIDIA_API_KEY is not set in environment settings")
        if not base_url:
            raise ValueError("NVIDIA_API_URL is not set in environment settings")
        _client = AsyncOpenAI(api_key=key, base_url=base_url)
    return _client


async def get_embedding(text: str, input_type: str = "query") -> List[float]:
    client = get_client()
    model = settings.EMBEDDING_MODEL
    if not model:
        raise ValueError("EMBEDDING_MODEL is not set in environment settings")


    response = await client.embeddings.create(
        input=[text],
        model=model,
        encoding_format="float",
        extra_body={"input_type": input_type, "truncate": "NONE"}
    )
    return response.data[0].embedding
