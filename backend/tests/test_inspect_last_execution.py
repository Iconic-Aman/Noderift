# Test script to inspect the last execution's node logs and outputs
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from core.database import SessionLocal
from models.execution import Execution
from models.node_log import NodeLog


def inspect_last_execution():
    db = SessionLocal()
    try:
        last_exec = db.query(Execution).order_by(Execution.started_at.desc()).first()
        if not last_exec:
            print("❌ No executions found in database.")
            return

        print(f"📌 Last Execution ID: {last_exec.id}")
        print(f"   Status: {last_exec.status}")
        print(f"   Error: {last_exec.error}")

        node_logs = db.query(NodeLog).filter(NodeLog.execution_id == last_exec.id).order_by(NodeLog.started_at).all()
        print(f"\n=== NODE LOGS ({len(node_logs)}) ===")
        for log in node_logs:
            print(f"\nNode ID: {log.node_id} ({log.node_type})")
            print(f"Status: {log.status}")
            print(f"Input: {log.input}")
            print(f"Output: {log.output}")
            print(f"Error: {log.error}")

    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    inspect_last_execution()
