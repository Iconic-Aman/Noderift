import asyncio
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from core.config import settings

@tool
def add_numbers(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

async def main():
    llm = ChatGroq(
        model=settings.GROQ_MODEL,
        api_key=settings.GROQ_API_KEY,
    )
    # Bind tools
    llm_with_tools = llm.bind_tools([add_numbers])
    
    # Test call
    res = await llm_with_tools.ainvoke("What is 35 + 45?")
    print("Response class:", res.__class__.__name__)
    print("Content:", res.content)
    print("Tool calls:", getattr(res, "tool_calls", []))

if __name__ == "__main__":
    asyncio.run(main())