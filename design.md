# Full tech stack for building Noderift (an n8n-like workflow automation tool)

**Note:** Green/checked items (✓) are recommended top picks. Alternatives are shown where relevant.

## Layer 1: Canvas UI — the node editor

> **Tip:** React Flow is the right choice. It handles drag-and-drop nodes, bezier edges, custom node types, zoom/pan, and minimap out of the box. Used by Retool, Stripe, and many others for exactly this use case.

- **React Flow ✓**: Node canvas, edges, drag-drop, zoom/pan
  - *Detail:* npmjs: @xyflow/react
- **React + Vite**: Frontend framework + fast dev bundler
  - *Alt:* Next.js if you need SSR
- **Zustand**: Canvas state — nodes, edges, selections
  - *Alt:* Jotai, Redux Toolkit
- **Tailwind CSS**: Node styling, sidebar, panels
  - *Alt:* shadcn/ui components
- **Monaco Editor**: Code node editor with syntax highlight
  - *Detail:* Same editor as VS Code

## Layer 2: Backend API — workflow CRUD + auth

- **FastAPI ✓**: REST API — save/load workflows, trigger executions
  - *Alt:* Node.js + Express/Hono
- **PostgreSQL**: Store workflows, credentials, execution history
  - *Detail:* Workflows stored as JSON in JSONB col
- **SQLAlchemy + Alembic**: ORM + schema migrations
  - *Alt:* Prisma if using Node
- **JWT + OAuth2**: Auth — user login, API keys
  - *Alt:* Clerk or Auth0 for quick start
- **Redis**: Execution queue, caching, pub/sub for logs
  - *Detail:* Required for async jobs

## Layer 3: Execution engine — workflow runner

> **Warning:** This is the hardest layer to build. Noderift's core is essentially a DAG executor — it reads the node graph and runs nodes in dependency order, passing data between them. You build this yourself in Python.

- **Custom DAG runner ✓**: Read workflow JSON → execute nodes in order → pass data
  - *Detail:* Build with Python asyncio
- **Celery + Redis**: Async task queue — execute workflows in background
  - *Alt:* ARQ (async), RQ
- **LangGraph ✓**: AI agent nodes — multi-step reasoning, tool use, memory
  - *Detail:* Only for AI agent sub-workflows
- **LangChain**: LLM integrations, prompts, chains inside AI nodes
  - *Detail:* Works alongside LangGraph
- **Temporal.io**: Durable workflows — retries, timeouts, long-running flows
  - *Alt:* Prefect, Airflow (heavier)

## Layer 4: Node integrations — connectors

- **httpx / requests**: Generic HTTP node for any REST API
  - *Detail:* Core of 80% of integrations
- **Playwright**: Browser automation node — scraping, clicking
  - *Alt:* Puppeteer (Node)
- **Composio**: Pre-built connectors — Gmail, Slack, Sheets, 200+ apps
  - *Detail:* Saves months of OAuth work
- **Pydantic**: Node input/output schema validation
  - *Detail:* Required for type safety
- **Docker sandbox**: Isolate user code nodes safely
  - *Alt:* Firecracker MicroVMs

## Layer 5: Triggers — how workflows start

- **APScheduler**: Cron / scheduled triggers inside Python
  - *Alt:* Celery Beat
- **Webhook endpoints**: Trigger via HTTP POST — Stripe, GitHub, etc.
  - *Detail:* FastAPI route per workflow
- **WebSockets**: Stream live execution logs to the UI
  - *Detail:* FastAPI + WebSocket or SSE
- **Ngrok / Cloudflare Tunnel**: Expose local webhooks in dev
  - *Detail:* Dev only

## Layer 6: Infra + deployment

- **Docker + Compose**: Self-host packaging — API, worker, DB, Redis
  - *Detail:* Essential for open-source release
- **Railway / Render**: Managed cloud deploy for early stage
  - *Alt:* AWS ECS, GCP Cloud Run
- **Pgvector**: Persistent vector memory for AI agents
  - *Detail:* Postgres extension — no extra DB
- **S3 / Cloudflare R2**: Store execution artifacts, file outputs
  - *Detail:* R2 is free egress

## Recommended start order

1. **React Flow canvas** → 2. **FastAPI + Postgres** → 3. **DAG executor** → 4. **HTTP + Code nodes** → 5. **LangGraph AI nodes**
