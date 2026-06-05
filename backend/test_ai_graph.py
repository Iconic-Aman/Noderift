import sys
import os
import asyncio
import json

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from core.config import settings
from core.ai_graph import graph
from langchain_core.messages import HumanMessage
from models.user import User
from models.workflow import Workflow

async def test_langgraph_agent():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No user found in DB. Please run database seeding.")
            return

        workflow = db.query(Workflow).filter(Workflow.user_id == user.id).first()
        if not workflow:
            workflow = Workflow(
                user_id=user.id,
                name="Test LangGraph Workflow",
                graph={"nodes": [], "edges": []}
            )
            db.add(workflow)
            db.commit()
            db.refresh(workflow)
            print(f"Created temp workflow: {workflow.id}")

        user_query = "Get weather from https://api.open-meteo.com/v1/forecast?latitude=25.59&longitude=85.13&current_weather=true and send it to ice.age.2442@gmail.com every Monday 11:00 AM"
        print(f"User Query: {user_query}")

        inputs = {
            "messages": [HumanMessage(content=user_query)],
            "current_graph": workflow.graph,
            "proposal": None,
            "validation_error": None,
            "retry_count": 0
        }

        config = {
            "configurable": {
                "thread_id": f"test_session_{workflow.id}",
                "api_key": settings.NVIDIA_API_KEY,
                "base_url": settings.NVIDIA_API_URL,
                "model": settings.LLM_MODEL,
                "db": db,
                "temperature": 0.7
            }
        }

        print("Invoking LangGraph Agent...")
        result = await graph.ainvoke(inputs, config=config)

        print("\n=== AGENT RESPONSE ===")
        print(result["messages"][-1].content)
        
        print("\n=== GENERATED PROPOSAL ===")
        print(json.dumps(result.get("proposal"), indent=2))
        
        print("\n=== RETRIES RUN ===")
        print(f"Retry count: {result.get('retry_count')}")
        print(f"Validation error: {result.get('validation_error')}")

    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_langgraph_agent())
