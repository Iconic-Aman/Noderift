import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.user import User
from models.workflow import Workflow
from models.execution import Execution
from models.node_log import NodeLog
from core.dag_runner import DAGRunner

async def test_data_passing():
    db = SessionLocal()
    try:
        # Get or create user
        user = db.query(User).first()
        if not user:
            user = User(email="test@noderift.dev", hashed_password="mock")
            db.add(user)
            db.commit()
            db.refresh(user)

        # Create workflow
        workflow = Workflow(
            user_id=user.id,
            name="E2E Data Passing Test",
            graph={
                "nodes": [
                    {
                        "id": "schedule-1",
                        "type": "schedule",
                        "data": {
                            "label": "Schedule",
                            "config": {}
                        }
                    },
                    {
                        "id": "http-2",
                        "type": "http",
                        "data": {
                            "label": "Get Weather",
                            "config": {
                                "url": "https://api.open-meteo.com/v1/forecast?latitude=25.59&longitude=85.13&current_weather=true",
                                "method": "GET"
                            }
                        }
                    },
                    {
                        "id": "whatsapp-3",
                        "type": "whatsapp",
                        "data": {
                            "label": "WhatsApp Send",
                            "config": {
                                "whatsapp_access_token": "mock_token",
                                "whatsapp_phone_number_id": "mock_id",
                                "whatsapp_api_url": "https://graph.facebook.com/v17.0",
                                "to": "919876543210",
                                "message": "Patna weather temp is {current_weather.temperature} C."
                            }
                        }
                    }
                ],
                "edges": [
                    {"source": "schedule-1", "target": "http-2"},
                    {"source": "http-2", "target": "whatsapp-3"}
                ]
            }
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        print(f"Created workflow: {workflow.id}")

        # Create execution record
        execution = Execution(
            workflow_id=workflow.id,
            status="pending",
            triggered_by="manual"
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        print(f"Created execution: {execution.id}")

        # Run the DAG
        runner = DAGRunner(execution_id=execution.id)
        try:
            await runner.run()
        except Exception as e:
            # We expect whatsapp node to fail due to mock token, which is fine!
            print(f"Execution run completed (expected failure/success): {e}")

        # Inspect database node logs
        logs = db.query(NodeLog).filter(NodeLog.execution_id == execution.id).all()
        print("\n=== EXECUTION NODE LOGS ===")
        for log in logs:
            print(f"Node: {log.node_id} ({log.node_type})")
            print(f"  Status: {log.status}")
            print(f"  Input Config: {log.input}")
            print(f"  Output: {log.output}")
            print(f"  Error: {log.error}")

            if log.node_id == "whatsapp-3":
                # Check that placeholder was replaced with a number/string in the input config
                msg = log.input.get("message", "")
                print(f"\nResult message: {msg}")
                if "Patna weather temp is" in msg and "{current_weather.temperature}" not in msg:
                    print("SUCCESS: Interpolation worked! Temperature resolved.")
                else:
                    print("FAILURE: Interpolation failed or did not resolve placeholder.")

        # Cleanup
        db.delete(execution)
        db.delete(workflow)
        db.commit()
        print("\nCleanup completed.")

    except Exception as e:
        print(f"Test failed with error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_data_passing())
