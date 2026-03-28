from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class WorkflowStepRead(BaseModel):
    id: str
    run_id: str
    stage_index: int
    stage_id: str
    role_key: str | None
    executor: str | None
    status: str
    input_summary: str | None
    output_summary: str | None
    token_usage: dict[str, Any] | None
    error_message: str | None
    langfuse_trace_id: str | None
    langfuse_observation_id: str | None
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkflowRunRead(BaseModel):
    id: str
    task_id: str
    workflow_definition_id: str
    status: str
    current_stage_index: int
    langgraph_thread_id: str | None
    langfuse_trace_id: str | None
    created_at: datetime
    updated_at: datetime
    steps: list[WorkflowStepRead] = []

    model_config = {"from_attributes": True}


class WorkflowRunCreate(BaseModel):
    """Trigger a run for a task — optionally override workflow definition."""
    workflow_definition_id: str | None = None


class WorkflowRunResume(BaseModel):
    """Resume a paused run after a human_gate."""
    approved: bool = True
    comment: str | None = None
