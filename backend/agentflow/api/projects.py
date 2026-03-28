from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from agentflow.auth import require_admin
from agentflow.db.models import Project, Task, Workspace
from agentflow.db.session import get_session
from agentflow.schemas.projects import ProjectCreate, ProjectRead, ProjectUpdate
from agentflow.schemas.tasks import TaskRead

router = APIRouter(prefix="/projects", tags=["projects"], dependencies=[Depends(require_admin)])

_WORKSPACE_SLUG = "default"


async def _get_workspace(session: AsyncSession) -> Workspace:
    result = await session.execute(select(Workspace).where(Workspace.slug == _WORKSPACE_SLUG))
    workspace = result.scalar_one_or_none()
    if workspace is None:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Workspace not initialized")
    return workspace


async def _project_or_404(session: AsyncSession, project_id: str) -> Project:
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def _project_to_read(project: Project, task_count: int) -> ProjectRead:
    base = ProjectRead.model_validate(project, from_attributes=True)
    return base.model_copy(update={"task_count": task_count})


@router.get("", response_model=list[ProjectRead])
async def list_projects(session: AsyncSession = Depends(get_session)):
    workspace = await _get_workspace(session)
    result = await session.execute(select(Project).where(Project.workspace_id == workspace.id).order_by(Project.updated_at.desc()))
    projects = result.scalars().all()
    out: list[ProjectRead] = []
    for p in projects:
        cnt = await session.scalar(select(func.count()).select_from(Task).where(Task.project_id == p.id))
        out.append(_project_to_read(p, int(cnt or 0)))
    return out


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(body: ProjectCreate, session: AsyncSession = Depends(get_session)):
    workspace = await _get_workspace(session)
    project = Project(workspace_id=workspace.id, **body.model_dump())
    session.add(project)
    await session.commit()
    await session.refresh(project)
    return _project_to_read(project, 0)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: str, session: AsyncSession = Depends(get_session)):
    project = await _project_or_404(session, project_id)
    cnt = await session.scalar(select(func.count()).select_from(Task).where(Task.project_id == project.id))
    return _project_to_read(project, int(cnt or 0))


@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: str, body: ProjectUpdate, session: AsyncSession = Depends(get_session)):
    project = await _project_or_404(session, project_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    await session.commit()
    await session.refresh(project)
    cnt = await session.scalar(select(func.count()).select_from(Task).where(Task.project_id == project.id))
    return _project_to_read(project, int(cnt or 0))


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, session: AsyncSession = Depends(get_session)):
    project = await _project_or_404(session, project_id)
    await session.execute(update(Task).where(Task.project_id == project_id).values(project_id=None))
    await session.delete(project)
    await session.commit()


@router.get("/{project_id}/tasks", response_model=list[TaskRead])
async def list_project_tasks(project_id: str, session: AsyncSession = Depends(get_session)):
    await _project_or_404(session, project_id)
    result = await session.execute(
        select(Task)
        .where(Task.project_id == project_id)
        .order_by(Task.status, Task.position, Task.created_at)
    )
    return result.scalars().all()
