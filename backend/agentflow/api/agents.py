from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agentflow.auth import require_admin
from agentflow.db.models import AgentConfig, Workspace
from agentflow.db.session import get_session
from agentflow.schemas.agents import AgentConfigCreate, AgentConfigRead, AgentConfigUpdate

router = APIRouter(prefix="/agents", tags=["agents"], dependencies=[Depends(require_admin)])

_WORKSPACE_SLUG = "default"


async def _get_workspace(session: AsyncSession) -> Workspace:
    result = await session.execute(select(Workspace).where(Workspace.slug == _WORKSPACE_SLUG))
    workspace = result.scalar_one_or_none()
    if workspace is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Workspace not initialized")
    return workspace


@router.get("", response_model=list[AgentConfigRead])
async def list_agents(session: AsyncSession = Depends(get_session)):
    workspace = await _get_workspace(session)
    result = await session.execute(
        select(AgentConfig).where(AgentConfig.workspace_id == workspace.id).order_by(AgentConfig.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=AgentConfigRead, status_code=status.HTTP_201_CREATED)
async def create_agent(body: AgentConfigCreate, session: AsyncSession = Depends(get_session)):
    workspace = await _get_workspace(session)
    agent = AgentConfig(workspace_id=workspace.id, **body.model_dump())
    session.add(agent)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentConfigRead)
async def get_agent(agent_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(AgentConfig).where(AgentConfig.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentConfigRead)
async def update_agent(agent_id: str, body: AgentConfigUpdate, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(AgentConfig).where(AgentConfig.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(agent, field, value)
    await session.commit()
    await session.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(AgentConfig).where(AgentConfig.id == agent_id))
    agent = result.scalar_one_or_none()
    if agent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    await session.delete(agent)
    await session.commit()
