import asyncio
import json
import logging
import sys
import os

# Enable verbose langchain logs to see tool calling
import langchain
langchain.debug = True

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from core.config import settings
from models.user import User
from models.workflow import Workflow
from ai.planner.agent import get_planner_agent

async def run_test():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No user found. Please run seeding.")
            return

        workflow = db.query(Workflow).filter(Workflow.user_id == user.id).first()
        if not workflow:
            workflow = Workflow(
                user_id=user.id,
                name="Test Planner Workflow",
                graph={"nodes": [], "edges": []}
            )
            db.add(workflow)
            db.commit()
            db.refresh(workflow)
            print(f"Created temporary workflow: {workflow.id}")
        else:
            print(f"Using workflow: {workflow.id}")

        # Reset graph state
        workflow.graph = {"nodes": [], "edges": []}
        db.commit()

        # Build agent
        key = settings.NVIDIA_API_KEY
        base_url = settings.NVIDIA_API_URL
        model = settings.LLM_MODEL
        print(f"Using Model: {model}")
        
        agent = get_planner_agent(key, base_url, model)

        query = "create a workflow which will send me a picture of dog getting from https://dog.ceo/api/breeds/image/random and send me everyday"
        print(f"\nUser: {query}")
        
        from langchain_core.messages import HumanMessage
        import time
        inputs = {"messages": [HumanMessage(content=query)]}

        config = {
            "configurable": {
                "session_id": workflow.id,
                "db": db
            }
        }

        print("Running agent...")
        start = time.time()
        result = await agent.ainvoke(inputs, config=config)
        elapsed = time.time() - start
        print(f"\nAgent finished in {elapsed:.1f} seconds")

        print("\n=== Full Conversation Message Trajectory ===")
        for idx, msg in enumerate(result.get("messages", [])):
            print(f"\n--- Message {idx} ({msg.__class__.__name__}) ---")
            print(f"Content: {msg.content}")
            if hasattr(msg, "tool_calls") and msg.tool_calls:
                print(f"Tool Calls: {msg.tool_calls}")
            if msg.__class__.__name__ == "ToolMessage":
                print(f"Tool Name: {getattr(msg, 'name', 'N/A')}")

        db.refresh(workflow)

        print("\n=== Updated Graph in Database ===")
        print(json.dumps(workflow.graph, indent=2))

    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_test())
