# Noderift — FastAPI API Reference

> **Deploy-first.** Every step below ships a working endpoint to Render before moving on.
> Base URL (prod): `https://noderift-api.onrender.com`
> Base URL (local): `http://localhost:8000`

---

## Deploy Workflow (Repeat Every Step)

```
code → test locally → git push → Render auto-deploys → verify live URL → next step
```

### One-time Render setup
1. Create new **Web Service** on Render → connect GitHub repo
2. Root directory: `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add env vars: `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`

---

## Step 1 — Skeleton (Ship first)

**File:** `backend/main.py`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | ❌ | Root — returns `{"service": "noderift-api", "status": "ok"}` |
| `GET` | `/health` | ❌ | Health check — returns `{"status": "healthy", "version": "0.1.0"}` |
| `GET` | `/docs` | ❌ | Swagger UI (FastAPI auto-generated) |
| `GET` | `/redoc` | ❌ | ReDoc UI |

**Goal:** `GET /health` returns 200 on Render. That's it. Deploy this first.

```python
# What /health returns
{
  "status": "healthy",
  "version": "0.1.0",
  "timestamp": "2025-05-03T08:30:00Z"
}
```

---

## Step 2 — Auth Endpoints

**Router:** `backend/api/routes/auth.py`
**Prefix:** `/auth`

**Auth Strategy:**
1. Check `Authorization: Bearer <token>` header (for testing/Swagger).
2. Fallback to `access_token` cookie (set by Google OAuth).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/auth/google/login` | ❌ | Redirect to Google OAuth consent screen |
| `GET` | `/auth/google/callback` | ❌ | Handle Google callback, set HTTP-only cookie |
| `GET` | `/auth/me` | ✅ Cookie/Header | Get current user profile |
| `POST` | `/auth/logout` | ✅ Cookie/Header | Clear auth cookie |

### GET `/auth/google/login`
Redirects browser to Google consent screen.

### GET `/auth/google/callback`
```json
// Response 302 Redirect to Frontend
// Sets Cookie: access_token=eyJhbGci...; HttpOnly; Secure; SameSite=Lax
```

### GET `/auth/me`
```json
// Response 200
{
  "id": "uuid",
  "email": "user@gmail.com",
  "name": "Jane Doe",
  "picture": "https://...",
  "created_at": "2025-05-03T08:30:00Z"
}
```

---

## Step 3 — Workflow CRUD

**Router:** `backend/api/routes/workflows.py`
**Prefix:** `/workflows`
**Auth:** All endpoints require JWT

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/workflows` | ✅ JWT | Create new workflow |
| `GET` | `/workflows` | ✅ JWT | List all workflows for current user |
| `GET` | `/workflows/{id}` | ✅ JWT | Get single workflow with full graph |
| `PUT` | `/workflows/{id}` | ✅ JWT | Update workflow (name, graph, config) |
| `DELETE` | `/workflows/{id}` | ✅ JWT | Delete workflow |
| `PATCH` | `/workflows/{id}/activate` | ✅ JWT | Toggle `is_active` true/false |
| `POST` | `/workflows/{id}/duplicate` | ✅ JWT | Clone a workflow |

### POST `/workflows`
```json
// Request
{
  "name": "My first workflow",
  "description": "Sends Slack message on new GitHub PR",
  "graph": {
    "nodes": [
      {
        "id": "node_1",
        "type": "webhook_trigger",
        "position": { "x": 100, "y": 200 },
        "config": { "method": "POST" }
      },
      {
        "id": "node_2",
        "type": "http_request",
        "position": { "x": 400, "y": 200 },
        "config": {
          "url": "https://hooks.slack.com/...",
          "method": "POST",
          "body": "{ \"text\": \"New PR!\" }"
        }
      }
    ],
    "edges": [
      { "id": "e1", "source": "node_1", "target": "node_2" }
    ]
  }
}

// Response 201
{
  "id": "wf_uuid",
  "name": "My first workflow",
  "description": "...",
  "is_active": false,
  "graph": { ... },
  "created_at": "...",
  "updated_at": "..."
}
```

### GET `/workflows`
```json
// Response 200
{
  "items": [
    {
      "id": "wf_uuid",
      "name": "My first workflow",
      "is_active": false,
      "node_count": 2,
      "last_execution": null,
      "created_at": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

## Step 4 — Executions

**Router:** `backend/api/routes/executions.py`
**Prefix:** `/executions`
**Auth:** All endpoints require JWT

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/executions/{workflow_id}` | ✅ JWT | Manually trigger workflow execution |
| `GET` | `/executions` | ✅ JWT | List executions (filterable by workflow) |
| `GET` | `/executions/{id}` | ✅ JWT | Get execution status + node logs |
| `POST` | `/executions/{id}/cancel` | ✅ JWT | Cancel running execution |
| `GET` | `/executions/{id}/logs` | ✅ JWT | Get full node-by-node execution log |
| `WebSocket` | `/ws/executions/{id}/logs` | ✅ JWT | Stream live logs during execution |

### POST `/executions/{workflow_id}`
```json
// Request (optional input data)
{
  "input": { "key": "value" }
}

// Response 202
{
  "execution_id": "exec_uuid",
  "workflow_id": "wf_uuid",
  "status": "pending",
  "triggered_by": "manual",
  "started_at": "2025-05-03T08:30:00Z"
}
```

### GET `/executions/{id}`
```json
// Response 200
{
  "id": "exec_uuid",
  "workflow_id": "wf_uuid",
  "status": "success",  // pending | running | success | failed | cancelled
  "triggered_by": "manual",
  "started_at": "...",
  "finished_at": "...",
  "node_logs": [
    {
      "node_id": "node_1",
      "node_type": "webhook_trigger",
      "status": "success",
      "input": {},
      "output": { "body": "{...}", "headers": {} },
      "started_at": "...",
      "finished_at": "...",
      "duration_ms": 12
    }
  ]
}
```

---

## Step 5 — Webhooks (Trigger Endpoints)

**Router:** `backend/api/routes/webhooks.py`
**Prefix:** `/webhooks`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/webhooks` | ✅ JWT | Register webhook for a workflow |
| `GET` | `/webhooks` | ✅ JWT | List all webhooks for current user |
| `DELETE` | `/webhooks/{id}` | ✅ JWT | Delete webhook |
| `POST` | `/webhooks/trigger/{slug}` | ❌ | **Public** — external services POST here to fire workflow |
| `GET` | `/webhooks/trigger/{slug}` | ❌ | **Public** — GET variant (for browser-based triggers) |

### POST `/webhooks`
```json
// Request
{
  "workflow_id": "wf_uuid",
  "description": "GitHub PR webhook"
}

// Response 201
{
  "id": "wh_uuid",
  "workflow_id": "wf_uuid",
  "slug": "abc123xyz",
  "url": "https://noderift-api.onrender.com/webhooks/trigger/abc123xyz",
  "secret": "whsec_...",
  "created_at": "..."
}
```

---

## Step 6 — Credentials Vault

**Router:** `backend/api/routes/credentials.py`
**Prefix:** `/credentials`
**Auth:** All endpoints require JWT

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/credentials` | ✅ JWT | Store encrypted credential |
| `GET` | `/credentials` | ✅ JWT | List credential names (no values exposed) |
| `DELETE` | `/credentials/{id}` | ✅ JWT | Delete credential |

### POST `/credentials`
```json
// Request
{
  "name": "My Slack Token",
  "type": "api_key",             // api_key | oauth2 | basic_auth | custom
  "data": {
    "token": "xoxb-..."
  }
}

// Response 201
{
  "id": "cred_uuid",
  "name": "My Slack Token",
  "type": "api_key",
  "created_at": "..."
  // data field NEVER returned
}
```

---

## Step 7 — Cron Triggers

**Router:** `backend/api/routes/triggers.py`
**Prefix:** `/triggers`
**Auth:** All endpoints require JWT

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/triggers/cron` | ✅ JWT | Create cron schedule for workflow |
| `GET` | `/triggers/cron` | ✅ JWT | List all cron triggers |
| `PUT` | `/triggers/cron/{id}` | ✅ JWT | Update cron expression |
| `DELETE` | `/triggers/cron/{id}` | ✅ JWT | Delete cron trigger |
| `PATCH` | `/triggers/cron/{id}/toggle` | ✅ JWT | Enable/disable without deleting |

### POST `/triggers/cron`
```json
// Request
{
  "workflow_id": "wf_uuid",
  "cron_expression": "0 9 * * 1-5",   // every weekday at 9am
  "timezone": "Asia/Kolkata"
}

// Response 201
{
  "id": "cron_uuid",
  "workflow_id": "wf_uuid",
  "cron_expression": "0 9 * * 1-5",
  "timezone": "Asia/Kolkata",
  "next_run_at": "2025-05-05T03:30:00Z",
  "is_active": true
}
```

---

## Step 8 — Node Catalog

**Router:** `backend/api/routes/nodes.py`
**Prefix:** `/nodes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/nodes` | ✅ JWT | List all available node types |
| `GET` | `/nodes/{node_type}` | ✅ JWT | Get node schema (inputs, outputs, config fields) |
| `POST` | `/nodes/{node_type}/test` | ✅ JWT | Test a single node with mock input |

### GET `/nodes`
```json
// Response 200
{
  "nodes": [
    {
      "type": "http_request",
      "display_name": "HTTP Request",
      "description": "Make any HTTP call",
      "category": "core",          // core | integration | ai | trigger | logic
      "icon": "globe",
      "inputs": 1,
      "outputs": 1
    },
    {
      "type": "ai_agent",
      "display_name": "AI Agent",
      "description": "LangGraph agent with tool use",
      "category": "ai",
      "icon": "brain",
      "inputs": 1,
      "outputs": 1
    }
  ]
}
```

### POST `/nodes/{node_type}/test`
```json
// Request
{
  "config": {
    "url": "https://httpbin.org/get",
    "method": "GET"
  },
  "input": {}
}

// Response 200
{
  "status": "success",
  "output": { "status_code": 200, "body": { ... } },
  "duration_ms": 234
}
```

---

## Error Response Format

All errors follow this shape:

```json
{
  "error": {
    "code": "WORKFLOW_NOT_FOUND",
    "message": "Workflow wf_abc123 does not exist",
    "detail": null
  }
}
```

| HTTP Code | When |
|-----------|------|
| `400` | Bad request / validation error |
| `401` | Missing or invalid JWT |
| `403` | Accessing another user's resource |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `422` | Pydantic validation failure |
| `429` | Rate limit exceeded |
| `500` | Internal server error |

---

## Auth Header

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

---

## Full Endpoint Summary

| # | Method | Path | Auth | Phase |
|---|--------|------|------|-------|
| 1 | GET | `/health` | ❌ | Step 1 |
| 2 | GET | `/` | ❌ | Step 1 |
| 3 | GET | `/auth/google/login` | ❌ | Step 2 |
| 4 | GET | `/auth/google/callback` | ❌ | Step 2 |
| 5 | GET | `/auth/me` | ✅ | Step 2 |
| 6 | POST | `/auth/logout` | ✅ | Step 2 |
| 7 | POST | `/workflows` | ✅ | Step 3 |
| 8 | GET | `/workflows` | ✅ | Step 3 |
| 9 | GET | `/workflows/{id}` | ✅ | Step 3 |
| 10 | PUT | `/workflows/{id}` | ✅ | Step 3 |
| 11 | DELETE | `/workflows/{id}` | ✅ | Step 3 |
| 12 | PATCH | `/workflows/{id}/activate` | ✅ | Step 3 |
| 13 | POST | `/workflows/{id}/duplicate` | ✅ | Step 3 |
| 14 | POST | `/executions/{workflow_id}` | ✅ | Phase 3 |
| 15 | GET | `/executions` | ✅ | Phase 3 |
| 16 | GET | `/executions/{id}` | ✅ | Phase 3 |
| 17 | POST | `/executions/{id}/cancel` | ✅ | Phase 3 |
| 18 | GET | `/executions/{id}/logs` | ✅ | Phase 3 |
| 19 | WS | `/ws/executions/{id}/logs` | ✅ | Phase 3 |
| 20 | POST | `/webhooks` | ✅ | Phase 4 |
| 21 | GET | `/webhooks` | ✅ | Phase 4 |
| 22 | DELETE | `/webhooks/{id}` | ✅ | Phase 4 |
| 23 | POST | `/webhooks/trigger/{slug}` | ❌ | Phase 4 |
| 24 | GET | `/webhooks/trigger/{slug}` | ❌ | Phase 4 |
| 25 | POST | `/credentials` | ✅ | Phase 5 |
| 26 | GET | `/credentials` | ✅ | Phase 5 |
| 27 | DELETE | `/credentials/{id}` | ✅ | Phase 5 |
| 28 | POST | `/triggers/cron` | ✅ | Phase 4 |
| 29 | GET | `/triggers/cron` | ✅ | Phase 4 |
| 30 | PUT | `/triggers/cron/{id}` | ✅ | Phase 4 |
| 31 | DELETE | `/triggers/cron/{id}` | ✅ | Phase 4 |
| 32 | PATCH | `/triggers/cron/{id}/toggle` | ✅ | Phase 4 |
| 33 | GET | `/nodes` | ✅ | Phase 3 |
| 34 | GET | `/nodes/{node_type}` | ✅ | Phase 3 |
| 35 | POST | `/nodes/{node_type}/test` | ✅ | Phase 3 |
