from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

Priority = Literal["low", "medium", "high", "urgent"]
AssigneeKind = Literal["agent", "human"]


class TaskBase(BaseModel):
    title: str
    body: str | None = None
    project_id: str | None = None
    workflow_definition_id: str | None = None
    stage_overrides: dict[str, Any] | None = None
    status: str = "backlog"
    position: float = 0.0
    priority: Priority = "medium"
    assignee_type: AssigneeKind | None = None
    assignee_agent_id: str | None = None
    assignee_human_name: str | None = None
    reviewer_type: AssigneeKind | None = None
    reviewer_agent_id: str | None = None
    reviewer_human_name: str | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    project_id: str | None = None
    workflow_definition_id: str | None = None
    stage_overrides: dict[str, Any] | None = None
    status: str | None = None
    position: float | None = None
    priority: Priority | None = None
    assignee_type: AssigneeKind | None = None
    assignee_agent_id: str | None = None
    assignee_human_name: str | None = None
    reviewer_type: AssigneeKind | None = None
    reviewer_agent_id: str | None = None
    reviewer_human_name: str | None = None


class TaskMove(BaseModel):
    status: str
    position: float = Field(default=0.0, description="Sort order within the column")


class TaskRead(TaskBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
