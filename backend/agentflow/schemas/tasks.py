from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class TaskBase(BaseModel):
    title: str
    body: str | None = None
    workflow_definition_id: str | None = None
    stage_overrides: dict[str, Any] | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    workflow_definition_id: str | None = None
    stage_overrides: dict[str, Any] | None = None


class TaskRead(TaskBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
