"""FastAPI application entry point."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from agentflow.api.agents import router as agents_router
from agentflow.api.health import router as health_router
from agentflow.api.runs import router as runs_router
from agentflow.api.tasks import router as tasks_router
from agentflow.api.workflows import router as workflows_router
from agentflow.db.models import Base, Workspace
from agentflow.db.session import AsyncSessionLocal, engine
from agentflow.observability import langfuse_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # ── Startup ──────────────────────────────────────────────────────────────
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Workspace).where(Workspace.slug == "default"))
        if result.scalar_one_or_none() is None:
            session.add(Workspace(slug="default"))
            await session.commit()
            logger.info("Default workspace created")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    langfuse_client.flush()
    logger.info("Langfuse flushed on shutdown")


app = FastAPI(
    title="AgentFlow Orchestrator",
    description="Self-hosted control plane for multi-agent dev workflows.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(agents_router, prefix="/api/v1")
app.include_router(workflows_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(runs_router, prefix="/api/v1")
