# AGENTS.md — Guide for AI Agents Working on This Repository

This file gives AI coding agents (Cursor, Claude Code, Codex, etc.) the context
needed to work effectively on **AgentFlow Orchestrator** without asking the operator
for basic context.

---

## Project overview

AgentFlow is a self-hosted **control plane** for multi-agent dev workflows.  
Stack: **FastAPI** backend + **Next.js** frontend + **PostgreSQL/SQLite** + **LangGraph** (Phase B) + **Langfuse** observability.

## Repository layout

```
backend/
  agentflow/
    config.py          # Pydantic Settings — all env vars live here
    auth.py            # X-Admin-Token dependency
    observability.py   # Langfuse SDK init + @observe / propagate_attributes
    main.py            # FastAPI app, routers, startup/shutdown
    api/               # One file per resource: health, agents, workflows, tasks, runs
    db/
      models.py        # SQLAlchemy 2 ORM — ALL models in one file
      session.py       # async engine + get_session() dependency
    schemas/           # Pydantic v2 request/response schemas
    adapters/          # Executor adapters (base.py, registry.py, openrouter.py, claude_code.py)
    orchestration/
      runner.py        # Linear pipeline runner (Phase A stub → Phase B LangGraph)
  alembic/             # Migrations
  tests/               # pytest-asyncio tests

frontend/
  src/
    app/               # Next.js App Router pages
    components/        # Shared UI components
    lib/               # API client, utilities
    types/             # TypeScript types (mirror backend schemas)
```

## Key conventions

### Backend

- **Always use async** — every DB call, adapter call, and route handler is async.
- **All DB models** go in `agentflow/db/models.py`. Alembic autogenerate reads from there.
- **New API resource** → add a router in `agentflow/api/`, mount it in `main.py`, add Pydantic schemas in `agentflow/schemas/`.
- **New executor adapter** → subclass `BaseAdapter`, set a unique `name`, register in `adapter_registry` in `agentflow/adapters/registry.py`.
- **Observability** → decorate with `@observe()` from `agentflow.observability` and use `propagate_attributes()` for session/user metadata.  
  When Langfuse env vars are absent the decorator is a no-op — never guard with `if langfuse_enabled`.
- **Never log raw secrets** — token values, API keys, full LLM prompts must not appear in DB or logs without redaction.
- **Token usage** → always populate `WorkflowStep.token_usage` from adapter result when available.

### Frontend

- **API client** is in `frontend/src/lib/api.ts`. Add new resource calls there.
- **Types** in `frontend/src/types/` mirror backend Pydantic schemas.
- All pages live under `frontend/src/app/dashboard/`.
- Use Tailwind utility classes; no inline styles.

### Testing

```bash
cd backend
uv run pytest            # all tests
uv run pytest -k agents  # filter by name
uv run pytest --cov=agentflow
```

- Test files go in `backend/tests/`.
- Use `AsyncClient` + `ASGITransport` (httpx) — see `conftest.py`.
- Override `get_session` dependency with an in-memory SQLite session.
- Auth header constant: `ADMIN_HEADERS = {"X-Admin-Token": "changeme-admin-token-replace-in-production"}`.

### Migrations

```bash
cd backend
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
```

Always create a migration after adding/changing a model column.

## Phase B checklist (next implementation targets)

- [ ] LangGraph: replace `orchestration/runner.py` linear loop with a LangGraph `StateGraph`
- [ ] `adapters/openrouter.py`: implement real API call using `langfuse.openai` wrapper
- [ ] `adapters/claude_code.py`: implement subprocess call with timeout + sandbox cwd
- [ ] `orchestration/runner.py`: look up `AgentConfig` per `role_key` for model_name + instructions
- [ ] `orchestration/runner.py`: build prompt from prior step outputs (chain context)
- [ ] Add `langfuse_trace_id` to `WorkflowRun` on run start (capture from Langfuse context)
- [ ] SSE endpoint for run status streaming (replace polling)
- [ ] Frontend: real data fetching from API (replace mock data)

## Running locally

```bash
# Backend (SQLite, no Docker needed)
cp .env.example backend/.env
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn agentflow.main:app --reload --host 127.0.0.1 --port 8000

# Frontend
pnpm install          # from repo root
pnpm dev              # starts Next.js on :3000 (or :3001)

# With Postgres + Langfuse (optional)
docker compose up -d postgres
docker compose --profile langfuse up -d   # adds ClickHouse, Redis, MinIO, Langfuse
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `AGENTFLOW_DATABASE_URL` | Yes | SQLAlchemy URL (SQLite or asyncpg Postgres) |
| `AGENTFLOW_ADMIN_TOKEN` | Yes | Value for `X-Admin-Token` header |
| `OPENROUTER_API_KEY` | Phase B | OpenRouter API key |
| `LANGFUSE_SECRET_KEY` | Optional | Enables Langfuse tracing |
| `LANGFUSE_PUBLIC_KEY` | Optional | Enables Langfuse tracing |
| `LANGFUSE_BASE_URL` | Optional | Self-hosted Langfuse URL (default: cloud) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend base URL for browser |
