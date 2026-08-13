# Phase 3 — Execution Engine

Build the core that actually **runs** workflows. User hits "Run" → DAG executes nodes in order → live logs stream to UI.

---

## What We're Building

10 checklist items from design.md, grouped into 4 layers:

### Layer A — Database (already have models, need migration)

`executions` + `execution_logs` tables exist in models but need Alembic migration run.

### Layer B — Backend Engine (the hard part)

Core DAG runner + Celery + node registry + real nodes.

### Layer C — API Routes

New `executions.py` route + WebSocket endpoint.

### Layer D — Frontend

Execution panel on canvas + live log stream + history page.

---

## Files We'll Build

### 🔧 Backend — Core Engine

#### [NEW] `backend/core/celery_app.py`

Celery app init connected to Redis broker. Defines the Celery instance used everywhere.

#### [NEW] `backend/core/dag_runner.py`

The heart of Phase 3.

- Reads workflow JSON (nodes + edges from ReactFlow)
- Builds adjacency graph
- Topological sort (Kahn's algorithm)
- Runs each node in order via `asyncio`
- Pipes output of node A → input of node B
- Logs each node result to `execution_logs` table
- Publishes progress to Redis pub/sub (for WebSocket)

#### [MODIFY] `backend/nodes/__init__.py` → becomes node registry

Maps `node_type` strings → handler classes.
Currently empty. Will hold `NODE_REGISTRY = { "http_request": HttpRequestNode, "code": CodeNode }`.

#### [NEW] `backend/nodes/base.py`

`BaseNode` abstract class as per design.md spec. `execute(inputs, config) → NodeOutput`.

#### [NEW] `backend/nodes/http_node.py`

`HttpRequestNode` — uses `httpx` to call any REST API. Config: `url`, `method`, `headers`, `body`.

#### [NEW] `backend/nodes/code_node.py`

`CodeNode` — executes Python code string from node config in a sandboxed `exec()`. Phase 3 uses basic exec; Docker sandbox comes in Phase 5.

---

### 🌐 Backend — API Routes

#### [NEW] `backend/api/routes/executions.py`

```
POST /executions/{workflow_id}   → enqueue Celery task, return execution_id
GET  /executions/{workflow_id}   → list execution history
GET  /executions/{id}/status     → get single execution + node logs
DELETE /executions/{id}          → cancel (future)
```

#### [NEW] `backend/api/routes/websocket.py`

```
WS /ws/executions/{execution_id}/logs
```

Subscribes to Redis pub/sub channel for that execution. Streams JSON log events to the browser in real-time.

#### [MODIFY] `backend/main.py`

Register `executions` router + WebSocket router.

---

### 🛠️ Backend — Worker

#### [MODIFY] `worker/worker.py`

Currently empty stub. Will import Celery app + define `run_workflow_task(execution_id)` Celery task that calls `dag_runner.run()`.

---

### 🗄️ Backend — Schemas

#### [NEW] `backend/schemas/execution.py`

Pydantic request/response models: `ExecutionCreate`, `ExecutionResponse`, `NodeLogResponse`.

---

### ⚛️ Frontend — Hooks

#### [NEW] `frontend/src/hooks/useExecution.ts`

`useExecution(workflowId)` — POST to trigger, poll status, return `{ run, status, logs }`.

#### [NEW] `frontend/src/hooks/useWebSocket.ts`

`useWebSocket(executionId)` — connects to WS, accumulates log events, returns `{ logs, connected }`.

---

### ⚛️ Frontend — Components

#### [NEW] `frontend/src/components/panels/ExecutionPanel.tsx`

Drawer/panel that opens when user clicks "Run". Shows:

- Run button
- Execution status badge (pending / running / success / failed)
- Live scrolling log feed (one entry per node)
- Node name, status icon, duration, output preview

---

### ⚛️ Frontend — Pages

#### [NEW] `frontend/src/pages/history.tsx`

Execution history page per workflow. Table of past runs with status, timestamp, duration. Clicking a row shows the node logs for that run.

#### [MODIFY] `frontend/src/pages/editor.tsx`

Add "Run" button in toolbar. Wire it to `useExecution`. Open `ExecutionPanel` on run.

---

## Build Order

```
1. celery_app.py          ← foundation, everything imports this
2. base.py + registry     ← node system
3. http_node.py           ← first real node
4. code_node.py           ← second node
5. dag_runner.py          ← uses nodes + writes to DB
6. worker/worker.py       ← wraps dag_runner in Celery task
7. schemas/execution.py   ← needed by routes
8. routes/executions.py   ← REST API
9. routes/websocket.py    ← WS streaming
10. main.py update        ← register routes
11. useWebSocket.ts       ← frontend WS hook
12. useExecution.ts       ← frontend execution hook
13. ExecutionPanel.tsx    ← UI component
14. editor.tsx update     ← wire Run button
15. history.tsx           ← history page
```

## Verification Plan

- `POST /executions/{id}` returns 200 with `execution_id`
- Worker picks up task, DAG runs, logs appear in DB
- WebSocket streams logs to browser in real-time
- ExecutionPanel shows live node status updates
- History page lists past runs
