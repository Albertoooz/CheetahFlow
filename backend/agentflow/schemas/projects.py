from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

_DEFAULT_COLUMNS = ["backlog", "todo", "in_progress", "review", "done"]


class ProjectBase(BaseModel):
    name: str
    description: str | None = None
    columns: list[str] = Field(default_factory=lambda: list(_DEFAULT_COLUMNS))


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    columns: list[str] | None = None


class ProjectRead(ProjectBase):
    id: str
    workspace_id: str
    task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
