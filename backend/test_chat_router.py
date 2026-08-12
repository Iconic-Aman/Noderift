import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from ai.planner.chat_router import route_message


async def test_router():
    test_inputs = [
        "hi",
        "hey, how are you?",
        "what can you do for me?",
        "create a webhook node and connect it to python code node",
    ]

    print("\n--- STARTING CHAT ROUTER DIAGNOSTICS TEST ---\n")
    for msg in test_inputs:
        print(f"INPUT: '{msg}'")
        reply, should_build = await route_message(msg, [])
        print(f"  -> Should Build (70B): {should_build}")
        print(f"  -> Reply (8B): {reply if reply else '[Delegated to 70B builder]'}")
        print("-" * 50)


if __name__ == "__main__":
    asyncio.run(test_router())
