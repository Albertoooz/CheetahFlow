"""SQLAlchemy 2 ORM models.

All tables are declared here so Alembic autogenerate picks them up via a single import.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.utcnow()


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Workspace (single row in Phase 1)
# ---------------------------------------------------------------------------


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    slug: Mapped[str] = mapped_column(String, unique=True, index=True, default="default")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    agents: Mapped[list[AgentConfig]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    workflow_definitions: Mapped[list[WorkflowDefinition]] = relationship(back_populates="workspace", cascade="all, delete-orphan")
    tasks: Mapped[list[Task]] = relationship(back_populates="workspace", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Agent roster
# ---------------------------------------------------------------------------


class AgentConfig(Base):
    """One row per agent role (e.g. planner, implementer, reviewer)."""

    __tablename__ = "agent_configs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), index=True)
    role_key: Mapped[str] = mapped_column(String, index=True)
    display_name: Mapped[str] = mapped_column(String)
    model_provider: Mapped[str] = mapped_column(String, default="openrouter")  # openrouter | claude_code
    model_name: Mapped[str] = mapped_column(String, default="openai/gpt-4o-mini")
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="agents")


# ---------------------------------------------------------------------------
# Workflow definitions
# ---------------------------------------------------------------------------


class WorkflowDefinition(Base):
    """
    stages JSON shape (list of dicts):
    [
      {
        "id": "plan",
        "type": "agent",          # "agent" | "human_gate"
        "role_key": "planner",
        "label": "Planning",
        "executor": "openrouter"  # "openrouter" | "claude_code"
      },
      {
        "id": "review",
        "type": "human_gate",
        "label": "Human Review"
      }
    ]
    """

    __tablename__ = "workflow_definitions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    stages: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="workflow_definitions")
    runs: Mapped[list[WorkflowRun]] = relationship(back_populates="definition", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    workspace_id: Mapped[str] = mapped_column(ForeignKey("workspaces.id"), index=True)
    workflow_definition_id: Mapped[str | None] = mapped_column(
        ForeignKey("workflow_definitions.id"), nullable=True
    )
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Optional per-task overrides for stages (e.g. swap model for this task)
    stage_overrides: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    workspace: Mapped[Workspace] = relationship(back_populates="tasks")
    workflow_definition: Mapped[WorkflowDefinition | None] = relationship()
    runs: Mapped[list[WorkflowRun]] = relationship(back_populates="task", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# Workflow runs & steps
# ---------------------------------------------------------------------------


class WorkflowRun(Base):
    """One run per (task, trigger)."""

    __tablename__ = "workflow_runs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    task_id: Mapped[str] = mapped_column(ForeignKey("tasks.id"), index=True)
    workflow_definition_id: Mapped[str] = mapped_column(ForeignKey("workflow_definitions.id"))
    # pending | running | paused | completed | failed | cancelled
    status: Mapped[str] = mapped_column(String, default="pending")
    current_stage_index: Mapped[int] = mapped_column(Integer, default=0)
    # LangGraph checkpoint / thread id (Phase B)
    langgraph_thread_id: Mapped[str | None] = mapped_column(String, nullable=True)
    langfuse_trace_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    task: Mapped[Task] = relationship(back_populates="runs")
    definition: Mapped[WorkflowDefinition] = relationship(back_populates="runs")
    steps: Mapped[list[WorkflowStep]] = relationship(back_populates="run", cascade="all, delete-orphan")


class WorkflowStep(Base):
    """One step per stage execution within a run."""

    __tablename__ = "workflow_steps"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    run_id: Mapped[str] = mapped_column(ForeignKey("workflow_runs.id"), index=True)
    stage_index: Mapped[int] = mapped_column(Integer)
    stage_id: Mapped[str] = mapped_column(String)
    role_key: Mapped[str | None] = mapped_column(String, nullable=True)
    executor: Mapped[str | None] = mapped_column(String, nullable=True)  # openrouter | claude_code | human_gate
    # pending | running | completed | failed | skipped
    status: Mapped[str] = mapped_column(String, default="pending")
    input_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Redacted — never store raw API keys or full prompt/completion here
    token_usage: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(String, nullable=True)
    # Langfuse trace/observation IDs for deep-linking to the observability UI
    langfuse_trace_id: Mapped[str | None] = mapped_column(String, nullable=True)
    langfuse_observation_id: Mapped[str | None] = mapped_column(String, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    run: Mapped[WorkflowRun] = relationship(back_populates="steps")
