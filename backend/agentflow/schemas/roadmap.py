from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RoadmapItemBase(BaseModel):
    title: str = Field(..., examples=["User Authentication"])
    description: str | None = None
    status: str = "draft"


class RoadmapItemCreate(RoadmapItemBase):
    pass


class RoadmapItemUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None


class RoadmapItemRead(RoadmapItemBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SplitPreviewTask(BaseModel):
    title: str
    body: str | None = None
    priority: str = "medium"


class SplitPreviewResponse(BaseModel):
    tasks: list[SplitPreviewTask]
