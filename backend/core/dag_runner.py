import json
import time
from datetime import datetime, timezone
import redis.asyncio as aioredis
from sqlalchemy.orm import Session
from core.config import settings
from core.database import SessionLocal
from models.execution import Execution
from models.node_log import NodeLog
from models.workflow import Workflow
from nodes import get_node_class, NodeInput

class DAGRunner:
    def __init__(self, execution_id: str, trigger_payload: dict = None):
        self.execution_id = execution_id
        self.trigger_payload = trigger_payload or {}
        self.redis_client = aioredis.from_url(settings.REDIS_URL)

    async def publish_log(self, event_type: str, data: dict):
        """Publish status update to Redis pub/sub for live streaming."""
        channel = f"execution:{self.execution_id}:logs"
        payload = {
            "type": event_type,
            "execution_id": self.execution_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **data
        }
        await self.redis_client.publish(channel, json.dumps(payload))

    def topological_sort(self, nodes: list, edges: list) -> list:
        """Sort nodes using Kahn's algorithm. Detects cycles."""
        node_map = {n["id"]: n for n in nodes}
        in_degree = {n["id"]: 0 for n in nodes}
        adj_list = {n["id"]: [] for n in nodes}

        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in in_degree and tgt in in_degree:
                adj_list[src].append(tgt)
                in_degree[tgt] += 1

        # Queue of nodes with no incoming edges
        queue = [nid for nid, deg in in_degree.items() if deg == 0]
        sorted_nodes = []

        while queue:
            curr = queue.pop(0)
            sorted_nodes.append(node_map[curr])
            for neighbor in adj_list[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        if len(sorted_nodes) < len(nodes):
            raise ValueError("Workflow contains cycles (circular dependencies)")

        return sorted_nodes

    async def run(self, target_node_id: str = None):
        """Execute the DAG."""
        db: Session = SessionLocal()
        execution = db.query(Execution).filter(Execution.id == self.execution_id).first()
        if not execution:
            db.close()
            raise ValueError(f"Execution {self.execution_id} not found")

        workflow = db.query(Workflow).filter(Workflow.id == execution.workflow_id).first()
        if not workflow:
            execution.status = "failed"
            execution.error = "Workflow not found"
            execution.finished_at = datetime.now(timezone.utc)
            db.commit()
            db.close()
            raise ValueError("Workflow not found")

        # Update status to running
        execution.status = "running"
        execution.started_at = datetime.now(timezone.utc)
        db.commit()

        await self.publish_log("workflow_started", {"workflow_id": workflow.id})

        # Load graph
        graph = workflow.graph or {}
        nodes = graph.get("nodes", [])
        edges = graph.get("edges", [])

        # Store outputs by node ID
        node_outputs = {}
        # Keep track of parent relationship for inputs aggregation
        parent_map = {n["id"]: [] for n in nodes}
        for edge in edges:
            src = edge.get("source")
            tgt = edge.get("target")
            if tgt in parent_map:
                parent_map[tgt].append(src)

        try:
            sorted_nodes = self.topological_sort(nodes, edges)
        except Exception as e:
            execution.status = "failed"
            execution.error = str(e)
            execution.finished_at = datetime.now(timezone.utc)
            db.commit()
            await self.publish_log("workflow_failed", {"error": str(e)})
            db.close()
            return

        for node_dict in sorted_nodes:
            node_id = node_dict["id"]
            if target_node_id and node_id != target_node_id:
                continue

            # Extract actual type prefix from ID (e.g. "http-1716..." -> "http")
            raw_type = node_id.split("-")[0] if "-" in node_id else node_dict.get("type", "")
            
            # Map frontend types to backend registered types
            type_mapping = {
                "http": "http_request",
                "code": "code",
                "webhook": "webhook",
                "schedule": "schedule"
            }
            node_type = type_mapping.get(raw_type, raw_type)
            
            node_data = node_dict.get("data", {})
            node_config = node_data.get("config", {})
            node_name = node_data.get("label", node_type)

            # Create node log record
            node_log = NodeLog(
                execution_id=self.execution_id,
                node_id=node_id,
                node_type=node_type,
                status="running",
                started_at=datetime.now(timezone.utc)
            )
            db.add(node_log)
            db.commit()

            await self.publish_log("node_started", {
                "node_id": node_id,
                "node_name": node_name,
                "node_type": node_type
            })

            # Gather inputs from parent node outputs
            parents = parent_map.get(node_id, [])
            input_data = {}
            upstream_data = {}
            for parent_id in parents:
                parent_out = node_outputs.get(parent_id, {})
                # Merge into a flat dictionary
                input_data.update(parent_out)
                # Keep nested reference
                upstream_data[parent_id] = parent_out

            # If trigger node and has no parents, inject trigger_payload
            if (node_type == "webhook" or node_type == "schedule") and not parents:
                input_data.update(self.trigger_payload)

            input_data["_upstream"] = upstream_data
            node_input = NodeInput(data=input_data)

            start_time = time.time()
            try:
                # Get node handler
                node_cls = get_node_class(node_type)
                node_instance = node_cls()

                # Execute node
                node_output = await node_instance.execute(node_input, node_config)

                # Store output for child nodes
                node_outputs[node_id] = node_output.data

                # Calculate duration
                duration_ms = int((time.time() - start_time) * 1000)

                # Save successful node log
                node_log.status = "success"
                node_log.input = input_data
                node_log.output = node_output.data
                node_log.duration_ms = duration_ms
                node_log.finished_at = datetime.now(timezone.utc)
                db.commit()

                await self.publish_log("node_success", {
                    "node_id": node_id,
                    "node_name": node_name,
                    "output": node_output.data,
                    "duration_ms": duration_ms
                })

                if target_node_id:
                    break

            except Exception as e:
                # Capture exact duration on failure too
                duration_ms = int((time.time() - start_time) * 1000)
                error_msg = str(e)

                node_log.status = "failed"
                node_log.input = input_data
                node_log.error = error_msg
                node_log.duration_ms = duration_ms
                node_log.finished_at = datetime.now(timezone.utc)
                db.commit()

                await self.publish_log("node_failed", {
                    "node_id": node_id,
                    "node_name": node_name,
                    "error": error_msg,
                    "duration_ms": duration_ms
                })

                # Mark execution as failed and stop
                execution.status = "failed"
                execution.error = f"Node {node_name} failed: {error_msg}"
                execution.finished_at = datetime.now(timezone.utc)
                db.commit()

                await self.publish_log("workflow_failed", {
                    "error": f"Node {node_name} failed: {error_msg}"
                })
                db.close()
                await self.redis_client.close()
                return

        # If everything succeeded
        execution.status = "success"
        execution.finished_at = datetime.now(timezone.utc)
        db.commit()

        await self.publish_log("workflow_success", {})
        db.close()
        await self.redis_client.close()
