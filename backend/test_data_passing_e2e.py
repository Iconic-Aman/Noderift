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
                            "label": "Get Joke",
                            "config": {
                                "url": "https://official-joke-api.appspot.com/random_joke",
                                "method": "GET"
                            }
                        }
                    },
                    {
                        "id": "resend-3",
                        "type": "resend",
                        "data": {
                            "label": "Send Joke Email",
                            "config": {
                                "to": "aman.apk01@gmail.com",
                                "from": "onboarding@resend.dev",
                                "subject": "Joke of the Day",
                                "html": "Here is a joke for you:<br><br><b>{setup}</b><br><i>{punchline}</i>",
                                "_credential": {
                                    "api_key": "re_mock_key"
                                }
                            }
                        }
                    }
                ],
                "edges": [
                    {"source": "schedule-1", "target": "http-2"},
                    {"source": "http-2", "target": "resend-3"}
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
            # We expect resend node to fail due to mock token, which is fine!
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

            if log.node_id == "resend-3":
                # Check that placeholder was replaced with a number/string in the input config
                html = log.input.get("html", "")
                print(f"\nResult html: {html}")
                if "Here is a joke for you" in html and "{setup}" not in html and "{punchline}" not in html:
                    print("SUCCESS: Interpolation worked! Joke resolved.")
                else:
                    print("FAILURE: Interpolation failed or did not resolve placeholders.")

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
