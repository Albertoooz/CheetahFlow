from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from agentflow.auth import require_admin
from agentflow.db.models import Task, WorkflowDefinition, WorkflowRun
from agentflow.db.session import get_session
from agentflow.orchestration.runner import run_workflow_background
from agentflow.schemas.runs import WorkflowRunCreate, WorkflowRunRead, WorkflowRunResume

router = APIRouter(prefix="/tasks/{task_id}/runs", tags=["runs"], dependencies=[Depends(require_admin)])


async def _get_task(task_id: str, session: AsyncSession) -> Task:
    result = await session.execute(select(Task).where(Task.id == task_id))
    task = result.scalar_one_or_none()
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@router.get("", response_model=list[WorkflowRunRead])
async def list_runs(task_id: str, session: AsyncSession = Depends(get_session)):
    await _get_task(task_id, session)
    result = await session.execute(
        select(WorkflowRun)
        .where(WorkflowRun.task_id == task_id)
        .options(selectinload(WorkflowRun.steps))
        .order_by(WorkflowRun.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=WorkflowRunRead, status_code=status.HTTP_201_CREATED)
async def trigger_run(
    task_id: str,
    body: WorkflowRunCreate,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    task = await _get_task(task_id, session)

    # Determine which workflow definition to use
    wf_id = body.workflow_definition_id or task.workflow_definition_id
    if wf_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No workflow_definition_id on task or in request body",
        )
    wf_result = await session.execute(select(WorkflowDefinition).where(WorkflowDefinition.id == wf_id))
    wf = wf_result.scalar_one_or_none()
    if wf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="WorkflowDefinition not found")

    run = WorkflowRun(task_id=task_id, workflow_definition_id=wf_id, status="pending")
    session.add(run)
    await session.commit()
    await session.refresh(run)

    # Kick off in background — non-blocking
    background_tasks.add_task(run_workflow_background, run.id)

    # Reload with steps
    result = await session.execute(
        select(WorkflowRun).where(WorkflowRun.id == run.id).options(selectinload(WorkflowRun.steps))
    )
    return result.scalar_one()


@router.get("/{run_id}", response_model=WorkflowRunRead)
async def get_run(task_id: str, run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(WorkflowRun)
        .where(WorkflowRun.id == run_id, WorkflowRun.task_id == task_id)
        .options(selectinload(WorkflowRun.steps))
    )
    run = result.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    return run


@router.post("/{run_id}/resume", response_model=WorkflowRunRead)
async def resume_run(
    task_id: str,
    run_id: str,
    body: WorkflowRunResume,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """Resume a run that is paused at a human_gate stage."""
    result = await session.execute(
        select(WorkflowRun)
        .where(WorkflowRun.id == run_id, WorkflowRun.task_id == task_id)
        .options(selectinload(WorkflowRun.steps))
    )
    run = result.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    if run.status != "paused":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Run is not paused (current status: {run.status})",
        )

    if not body.approved:
        run.status = "cancelled"
        await session.commit()
        await session.refresh(run)
        return run

    run.status = "pending"
    run.current_stage_index += 1
    await session.commit()
    background_tasks.add_task(run_workflow_background, run.id)

    result2 = await session.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id).options(selectinload(WorkflowRun.steps))
    )
    return result2.scalar_one()


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_run(task_id: str, run_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(WorkflowRun).where(WorkflowRun.id == run_id, WorkflowRun.task_id == task_id)
    )
    run = result.scalar_one_or_none()
    if run is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Run not found")
    if run.status in ("completed", "failed", "cancelled"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Run already in terminal state: {run.status}",
        )
    run.status = "cancelled"
    await session.commit()
