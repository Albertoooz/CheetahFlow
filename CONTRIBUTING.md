# Contributing to AgentFlow Orchestrator

## Development setup

Follow the Quick start in [README.md](README.md).

## Code conventions

### Backend

- Python 3.11+, async everywhere, `uv` for packages.
- Linting: `uv run ruff check .` — must be clean before opening a PR.
- Types: `uv run mypy agentflow/` — no new errors allowed.
- Tests: `uv run pytest` — all must pass; new features need tests.
- All DB models in `agentflow/db/models.py` — Alembic autogenerates from there.
- New adapter → subclass `BaseAdapter`, register in `adapter_registry`.

### Frontend

- Next.js App Router, TypeScript strict, Tailwind only.
- API calls via `frontend/src/lib/api.ts`.
- Types mirror backend Pydantic schemas in `frontend/src/types/`.

## Adding a new adapter (Phase B guideline)

1. Create `backend/agentflow/adapters/my_adapter.py`, subclass `BaseAdapter`.
2. Set a unique `name` attribute (matches `executor` field in workflow stages).
3. Implement `execute()` — apply `@observe(as_type="generation")` to the LLM call.
4. Register in `backend/agentflow/adapters/registry.py`.
5. Add tests in `backend/tests/`.

## Adding a new API resource

1. Add ORM model to `agentflow/db/models.py`.
2. Create migration: `uv run alembic revision --autogenerate -m "add my_resource"`.
3. Add Pydantic schemas to `agentflow/schemas/my_resource.py`.
4. Add router to `agentflow/api/my_resource.py` and mount in `main.py`.
5. Add tests.

## Pull request checklist

- [ ] All tests pass: `uv run pytest`
- [ ] Ruff clean: `uv run ruff check .`
- [ ] Mypy clean: `uv run mypy agentflow/`
- [ ] Migration created if models changed
- [ ] AGENTS.md updated if conventions changed
