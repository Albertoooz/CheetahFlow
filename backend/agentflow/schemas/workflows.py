from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

# ---------------------------------------------------------------------------
# Stage definitions (validated before storage)
# ---------------------------------------------------------------------------


class AgentStage(BaseModel):
    id: str
    type: Literal["agent"] = "agent"
    role_key: str
    label: str = ""
    executor: Literal["openrouter", "claude_code"] = "openrouter"


class HumanGateStage(BaseModel):
    id: str
    type: Literal["human_gate"] = "human_gate"
    label: str = "Human review"


Stage = AgentStage | HumanGateStage


def validate_stages(raw: list[dict[str, Any]]) -> list[Stage]:
    result: list[Stage] = []
    for item in raw:
        stage_type = item.get("type")
        if stage_type == "agent":
            result.append(AgentStage(**item))
        elif stage_type == "human_gate":
            result.append(HumanGateStage(**item))
        else:
            raise ValueError(f"Unknown stage type: {stage_type!r}")
    return result


# ---------------------------------------------------------------------------
# Workflow definition CRUD schemas
# ---------------------------------------------------------------------------


class WorkflowDefinitionBase(BaseModel):
    name: str
    is_default: bool = False
    stages: list[dict[str, Any]] = Field(default_factory=list)

    @model_validator(mode="after")
    def _validate_stages(self) -> WorkflowDefinitionBase:
        validate_stages(self.stages)  # raises on bad data
        return self


class WorkflowDefinitionCreate(WorkflowDefinitionBase):
    pass


class WorkflowDefinitionUpdate(BaseModel):
    name: str | None = None
    is_default: bool | None = None
    stages: list[dict[str, Any]] | None = None

    @model_validator(mode="after")
    def _validate_stages(self) -> WorkflowDefinitionUpdate:
        if self.stages is not None:
            validate_stages(self.stages)
        return self


class WorkflowDefinitionRead(WorkflowDefinitionBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
