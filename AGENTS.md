# AGENTS.md — Guide for AI Agents Working on This Repository

This file gives AI coding agents (Cursor, Claude Code, GitHub Copilot, Codex, etc.) the context needed to work effectively on **CheetahFlow Orchestrator** without asking the operator for basic context.

**Cursor users:** additional guardrails live in [`.cursor/rules/`](.cursor/rules/) (`.mdc` files with globs). Those rules are Cursor-only; everything else is documented here.

**GitHub:** the **`main`** branch is **protected** — direct pushes are blocked. Work on a **feature branch** and open a **pull request** (see [CONTRIBUTING.md](CONTRIBUTING.md)).

---

## Project overview

CheetahFlow is a self-hosted **control plane** for multi-agent dev workflows.  
Stack: **FastAPI** backend + **Next.js** frontend + **PostgreSQL/SQLite** + **LangGraph** (Phase B) + **Langfuse** observability.

> The Python module is named `agentflow` (internal implementation detail).  
> All user-facing names, docs, and UI use **CheetahFlow**.

---

## Repository layout

```
backend/
  agentflow/
    config.py          # Pydantic Settings — env prefix: CHEETAHFLOW_
    auth.py            # X-Admin-Token dependency (require_admin)
    observability.py   # Langfuse stubs or SDK — @observe / propagate_attributes
    main.py            # FastAPI app, routers, startup/shutdown
    api/               # One file per resource: health, agents, workflows, tasks, runs, projects
    db/
      models.py        # SQLAlchemy 2 ORM — ALL models in one file
      session.py       # async engine + get_session() dependency
      migrate.py       # run_alembic_upgrade() on startup (file SQLite)
    schemas/           # Pydantic v2 request/response schemas
    adapters/          # Executor adapters (base, registry, openrouter, claude_code)
    orchestration/
      runner.py        # Linear pipeline runner (Phase A stub → Phase B LangGraph)
  alembic/             # Migrations (env.py, versions/*.py)
  tests/               # pytest-asyncio tests

frontend/
  src/
    app/               # Next.js App Router — dashboard under app/dashboard/
    components/        # Feature UI + components/ui primitives
    lib/               # API client (api.ts), utilities
    types/             # TypeScript types (mirror backend schemas)

assets/                # Logo and static assets
scripts/               # e.g. reset-langfuse-db.sh
```

---

## Backend conventions

### API routes

- One router module per resource under `agentflow/api/`. Mount new routers in `main.py`.
- Pydantic request/response models live in `agentflow/schemas/`.
- Protect routes with `Depends(require_admin)` from `agentflow/auth.py` (validates `X-Admin-Token`).

### Database and models

- **All ORM models** in `agentflow/db/models.py` only. Alembic autogenerate reads from there.
- **Async everywhere:** `async def` handlers, `await` for DB and external I/O. Use `get_session()` dependency.
- After adding or changing a column: create an Alembic revision and upgrade — `Base.metadata.create_all()` does not ALTER existing tables.

### Adapters

- Subclass `BaseAdapter` in `agentflow/adapters/`, set a unique `name`, implement `async def execute(...) -> AdapterResult`.
- Register instances in `adapter_registry` in `agentflow/adapters/registry.py`.
- Return structured `AdapterResult` with `output`, `token_usage`, and optional `langfuse_observation_id`.

### Orchestration

- `orchestration/runner.py` runs workflow steps (Phase A linear loop; Phase B → LangGraph). See Phase B checklist below.

### Observability

- Use `@observe()` and `propagate_attributes()` from `agentflow.observability` only — do **not** add new raw `from langfuse import ...` in application code (startup and import behavior are tightly controlled).
- When Langfuse env vars are absent, decorators are no-ops — **never** wrap calls in `if langfuse_enabled`.
- **Never log raw secrets** — tokens, API keys, full LLM prompts must not appear in DB or logs without redaction.
- Populate `WorkflowStep.token_usage` from adapter results when available.

---

## Frontend conventions

### Pages and components

- Dashboard pages under `frontend/src/app/dashboard/`.
- Feature components under `frontend/src/components/<feature>/`. Shared primitives under `frontend/src/components/ui/`.
- **Tailwind** utility classes only; no inline `style={{ ... }}` except unavoidable third-party cases.

### API client and types

- **All HTTP calls** to the backend go through `frontend/src/lib/api.ts` (add new endpoints there).
- In the browser, same-origin `/api/v1/...` is rewritten by Next.js to the FastAPI URL (see `next.config.ts`).
- Types in `frontend/src/types/` should mirror backend Pydantic schemas.

---

## Testing

```bash
cd backend
uv run pytest                 # all tests
uv run pytest -k agents       # filter by name
uv run pytest --cov=agentflow
```

- Tests live in `backend/tests/`.
- Use `AsyncClient` + `ASGITransport` (httpx). See `conftest.py` for DB override pattern (in-memory SQLite, default workspace).
- Override `get_session` with the test session factory; use `ADMIN_HEADERS = {"X-Admin-Token": "test-admin-token"}` in tests (must match env set in `conftest.py`).

---

## Migrations (Alembic)

```bash
cd backend
uv run alembic revision --autogenerate -m "describe change"
uv run alembic upgrade head
```

- **SQLite:** you cannot use `op.create_foreign_key()` directly — use `op.batch_alter_table(...)` for foreign keys (copy-and-move strategy).
- Prefer **idempotent** migrations where practical (`inspect` for existing tables/columns) so partial failures can be retried.
- Programmatic `run_alembic_upgrade()` builds `Config()` **without** pointing at `alembic.ini` so `env.py` does not call `fileConfig` and reset the root logger (which would hide uvicorn INFO logs).

---

## Docker and Langfuse (optional)

- Langfuse stack: `docker compose --profile langfuse up -d` (web UI typically **http://localhost:3100**).
- Headless init keys for Langfuse v3 self-hosted use **`lf_pk_...` / `lf_sk_...`** — not cloud-style `pk-lf-...` placeholders in `LANGFUSE_INIT_*` if those break init.
- Do **not** set empty `LANGFUSE_INIT_USER_PASSWORD=` etc. in `.env` — Docker Compose treats empty as “set” and overrides compose defaults (login breaks).
- `NEXTAUTH_URL` in compose must match the URL you open in the browser (`localhost` vs `127.0.0.1`).
- Postgres: if the data volume was created with a different `POSTGRES_USER`, you may need to recreate the volume or run `scripts/reset-langfuse-db.sh` after Postgres is healthy.

---

## Common gotchas

| Issue | What to know |
|--------|----------------|
| **SQLite FKs in Alembic** | Use `batch_alter_table` for `create_foreign_key`; raw `op.create_foreign_key` fails on SQLite. |
| **Startup “hangs” after Alembic logs** | Often `fileConfig` resetting log levels — fixed by `Config()` without ini path in `migrate.py`. Or Langfuse SDK import — use `observability.py` only. |
| **Langfuse 4.x** | Do not import the `langfuse` package at module level without both keys — use the stubs in `observability.py`. |
| **SQLite lock during migration** | `await engine.dispose()` before `run_alembic_upgrade()` in `main.py` lifespan so the async engine releases the DB file. |
| **Ports 8000 / 3001 in use** | Stop duplicate `uvicorn` / `next dev` or pick another port. |
| **Frozen lockfile CI** | Run `pnpm install` from repo root when `frontend/package.json` changes; commit `pnpm-lock.yaml`. |
| **Push to `main` rejected** | `main` is branch-protected — use a feature branch + PR; do not rely on `git push origin main`. |

---

## Phase B checklist (next implementation targets)

- [ ] LangGraph: replace `orchestration/runner.py` linear loop with a LangGraph `StateGraph`
- [ ] `adapters/openrouter.py`: implement real API call using `langfuse.openai` wrapper
- [ ] `adapters/claude_code.py`: implement subprocess call with timeout + sandbox cwd
- [ ] `orchestration/runner.py`: look up `AgentConfig` per `role_key` for model_name + instructions
- [ ] `orchestration/runner.py`: build prompt from prior step outputs (chain context)
- [ ] Add `langfuse_trace_id` to `WorkflowRun` on run start (capture from Langfuse context)
- [ ] SSE endpoint for run status streaming (replace polling)
- [ ] Frontend: tighten data fetching / loading states as needed

---

## Running locally

```bash
# Backend (SQLite; run from backend/)
cp ../.env.example .env   # or use root .env — see README
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn agentflow.main:app --reload --host 127.0.0.1 --port 8000

# Frontend (from repo root)
pnpm install
pnpm dev                  # Next.js on :3001

# Optional: Postgres + Langfuse
docker compose up -d postgres
docker compose --profile langfuse up -d
```

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `CHEETAHFLOW_DATABASE_URL` | Yes | SQLAlchemy URL (SQLite or asyncpg Postgres) |
| `CHEETAHFLOW_ADMIN_TOKEN` | Yes | Value for `X-Admin-Token` header |
| `OPENROUTER_API_KEY` | Phase B | OpenRouter API key |
| `LANGFUSE_SECRET_KEY` | Optional | Enables Langfuse tracing |
| `LANGFUSE_PUBLIC_KEY` | Optional | Enables Langfuse tracing |
| `LANGFUSE_BASE_URL` | Optional | Self-hosted Langfuse URL (default: cloud) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend base URL for server-side / tooling |
| `NEXT_PUBLIC_ADMIN_TOKEN` | Frontend | Admin token for browser API calls |
