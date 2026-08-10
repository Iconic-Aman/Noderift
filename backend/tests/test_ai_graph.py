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
        proposal = result.get("proposal")
        print(json.dumps(proposal, indent=2))
        
        print("\n=== RETRIES RUN ===")
        print(f"Retry count: {result.get('retry_count')}")
        print(f"Validation error: {result.get('validation_error')}")

        if proposal and proposal.get("nodes"):
            # Simulate applying the proposal on frontend: map proposed nodes/edges as current graph
            simulated_current_graph = {
                "nodes": [
                    {"id": n.get("id"), "type": n.get("type"), "config": n.get("config")}
                    for n in proposal.get("nodes", [])
                ],
                "edges": proposal.get("edges", [])
            }

            user_query_2 = "Actually, remove the resend email node and add a whatsapp node instead to send the weather update to 919876543210"
            print(f"\nUser Query 2 (Modification): {user_query_2}")

            inputs_2 = {
                "messages": result["messages"] + [HumanMessage(content=user_query_2)],
                "current_graph": simulated_current_graph,
                "proposal": None,
                "validation_error": None,
                "retry_count": 0
            }

            print("Invoking LangGraph Agent for modification...")
            result_2 = await graph.ainvoke(inputs_2, config=config)

            print("\n=== AGENT RESPONSE 2 ===")
            print(result_2["messages"][-1].content)

            print("\n=== GENERATED PROPOSAL 2 ===")
            print(json.dumps(result_2.get("proposal"), indent=2))

            print("\n=== RETRIES RUN 2 ===")
            print(f"Retry count: {result_2.get('retry_count')}")
            print(f"Validation error: {result_2.get('validation_error')}")

    except Exception as e:
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_langgraph_agent())
