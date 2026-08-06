import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.workflow import Workflow
from models.execution import Execution
from models.node_log import NodeLog
from core.dag_runner import DAGRunner
from datetime import datetime, timezone


async def test_execution_e2e():
    db = SessionLocal()
    try:
        # Get first workflow in DB
        wf = db.query(Workflow).first()
        if not wf:
            print("❌ No workflow found in database to test!")
            return

        print(f"📌 Testing workflow: ID={wf.id}, Name='{wf.name}'")
        nodes = wf.graph.get("nodes", []) if wf.graph else []
        edges = wf.graph.get("edges", []) if wf.graph else []
        print(f"   Nodes count: {len(nodes)}, Edges count: {len(edges)}")
        for n in nodes:
            print(f"   - Node ID: {n['id']}, Type: {n.get('type') or n.get('data', {}).get('node_type')}")

        # Create execution
        execution = Execution(
            workflow_id=wf.id,
            status="pending",
            triggered_by="manual",
            started_at=datetime.now(timezone.utc),
        )
        db.add(execution)
        db.commit()
        db.refresh(execution)
        print(f"📌 Created Execution record: ID={execution.id}")

        # Run DAGRunner
        print("🚀 Running DAGRunner.run()...")
        runner = DAGRunner(execution.id)
        await runner.run()

        # Check DB result
        db.refresh(execution)
        print(f"\n📊 Execution Result Status: '{execution.status}'")
        if execution.error:
            print(f"   Error: {execution.error}")

        # Fetch node logs
        logs = db.query(NodeLog).filter(NodeLog.execution_id == execution.id).all()
        print(f"   Node Logs recorded in DB: {len(logs)}")
        for log in logs:
            print(f"   - Node {log.node_id}: status={log.status}, duration={log.duration_ms}ms")
            if log.error:
                print(f"     Error: {log.error}")

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_execution_e2e())
