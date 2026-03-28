from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agentflow.auth import require_admin
from agentflow.db.models import WorkflowDefinition, Workspace
from agentflow.db.session import get_session
from agentflow.schemas.workflows import (
    WorkflowDefinitionCreate,
    WorkflowDefinitionRead,
    WorkflowDefinitionUpdate,
)

router = APIRouter(prefix="/workflows", tags=["workflows"], dependencies=[Depends(require_admin)])

_WORKSPACE_SLUG = "default"


async def _get_workspace(session: AsyncSession) -> Workspace:
    result = await session.execute(select(Workspace).where(Workspace.slug == _WORKSPACE_SLUG))
    workspace = result.scalar_one_or_none()
    if workspace is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Workspace not initialized")
    return workspace


@router.get("", response_model=list[WorkflowDefinitionRead])
async def list_workflows(session: AsyncSession = Depends(get_session)):
    workspace = await _get_workspace(session)
    result = await session.execute(
        select(WorkflowDefinition)
        .where(WorkflowDefinition.workspace_id == workspace.id)
        .order_by(WorkflowDefinition.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=WorkflowDefinitionRead, status_code=status.HTTP_201_CREATED)
async def create_workflow(body: WorkflowDefinitionCreate, session: AsyncSession = Depends(get_session)):
    workspace = await _get_workspace(session)
    wf = WorkflowDefinition(workspace_id=workspace.id, **body.model_dump())
    session.add(wf)
    await session.commit()
    await session.refresh(wf)
    return wf


@router.get("/{workflow_id}", response_model=WorkflowDefinitionRead)
async def get_workflow(workflow_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(WorkflowDefinition).where(WorkflowDefinition.id == workflow_id))
    wf = result.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return wf


@router.patch("/{workflow_id}", response_model=WorkflowDefinitionRead)
async def update_workflow(
    workflow_id: str, body: WorkflowDefinitionUpdate, session: AsyncSession = Depends(get_session)
):
    result = await session.execute(select(WorkflowDefinition).where(WorkflowDefinition.id == workflow_id))
    wf = result.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(wf, field, value)
    await session.commit()
    await session.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(WorkflowDefinition).where(WorkflowDefinition.id == workflow_id))
    wf = result.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    await session.delete(wf)
    await session.commit()
