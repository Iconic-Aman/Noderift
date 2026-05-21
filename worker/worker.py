import os
import sys
import asyncio

# Ensure backend directory is in the path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from core.celery_app import celery_app
from core.dag_runner import DAGRunner

@celery_app.task(name="worker.run_workflow_task")
def run_workflow_task(execution_id: str, target_node_id: str = None):
    """Celery task wrapper to execute workflow in async loop."""
    runner = DAGRunner(execution_id)
    # Run the async dag_runner using asyncio
    return asyncio.run(runner.run(target_node_id))
