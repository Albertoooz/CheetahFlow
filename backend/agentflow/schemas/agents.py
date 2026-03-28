from datetime import datetime

from pydantic import BaseModel, Field


class AgentConfigBase(BaseModel):
    role_key: str = Field(..., examples=["planner"])
    display_name: str = Field(..., examples=["Planner"])
    model_provider: str = Field("openrouter", examples=["openrouter", "claude_code"])
    model_name: str = Field("openai/gpt-4o-mini", examples=["openai/gpt-4o-mini"])
    enabled: bool = True
    instructions: str | None = None


class AgentConfigCreate(AgentConfigBase):
    pass


class AgentConfigUpdate(BaseModel):
    display_name: str | None = None
    model_provider: str | None = None
    model_name: str | None = None
    enabled: bool | None = None
    instructions: str | None = None


class AgentConfigRead(AgentConfigBase):
    id: str
    workspace_id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
