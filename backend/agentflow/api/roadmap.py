"""Roadmap API — epics / features that can be split into tasks by an AI agent."""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agentflow.auth import require_admin
from agentflow.config import get_settings
from agentflow.db.agent_lookup import get_enabled_agent_by_role_key
from agentflow.db.models import Project, RoadmapItem, Task, Workspace
from agentflow.db.session import get_session
from agentflow.schemas.roadmap import (
    RoadmapItemCreate,
    RoadmapItemRead,
    RoadmapItemUpdate,
    SplitPreviewResponse,
    SplitPreviewTask,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/projects/{project_id}/roadmap",
    tags=["roadmap"],
    dependencies=[Depends(require_admin)],
)

_WORKSPACE_SLUG = "default"
_SPLITTER_ROLE_KEY = "task_splitter"


async def _get_project(project_id: str, session: AsyncSession) -> Project:
    result = await session.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


@router.get("", response_model=list[RoadmapItemRead])
async def list_roadmap_items(project_id: str, session: AsyncSession = Depends(get_session)):
    await _get_project(project_id, session)
    result = await session.execute(
        select(RoadmapItem)
        .where(RoadmapItem.project_id == project_id)
        .order_by(RoadmapItem.created_at.desc())
    )
    return result.scalars().all()


@router.post("", response_model=RoadmapItemRead, status_code=status.HTTP_201_CREATED)
async def create_roadmap_item(
    project_id: str,
    body: RoadmapItemCreate,
    session: AsyncSession = Depends(get_session),
):
    await _get_project(project_id, session)
    item = RoadmapItem(project_id=project_id, **body.model_dump())
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return item


@router.get("/{item_id}", response_model=RoadmapItemRead)
async def get_roadmap_item(project_id: str, item_id: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(
        select(RoadmapItem).where(RoadmapItem.id == item_id, RoadmapItem.project_id == project_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found")
    return item


@router.patch("/{item_id}", response_model=RoadmapItemRead)
async def update_roadmap_item(
    project_id: str,
    item_id: str,
    body: RoadmapItemUpdate,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(RoadmapItem).where(RoadmapItem.id == item_id, RoadmapItem.project_id == project_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await session.commit()
    await session.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_roadmap_item(
    project_id: str,
    item_id: str,
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(RoadmapItem).where(RoadmapItem.id == item_id, RoadmapItem.project_id == project_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found")
    await session.delete(item)
    await session.commit()


@router.post("/{item_id}/split", response_model=SplitPreviewResponse)
async def split_roadmap_item(
    project_id: str,
    item_id: str,
    session: AsyncSession = Depends(get_session),
):
    """Use an AI agent to split a roadmap item (epic) into concrete tasks."""
    result = await session.execute(
        select(RoadmapItem).where(RoadmapItem.id == item_id, RoadmapItem.project_id == project_id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Roadmap item not found")

    previous_status = item.status
    item.status = "splitting"
    await session.commit()

    try:
        # Get the task_splitter agent config if it exists, else use defaults
        settings = get_settings()
        splitter = await get_enabled_agent_by_role_key(session, _SPLITTER_ROLE_KEY)
        model_name = splitter.model_name if splitter else "openai/gpt-4o-mini"
        instructions = splitter.instructions if splitter else None

        prompt = _build_split_prompt(item.title, item.description or "")
        tasks: list[SplitPreviewTask] = []

        if settings.openrouter_api_key:
            tasks = await _split_via_openrouter(
                prompt=prompt,
                model_name=model_name,
                instructions=instructions,
                api_key=settings.openrouter_api_key,
            )
        else:
            logger.warning("OPENROUTER_API_KEY not set — returning placeholder split tasks")
            tasks = _placeholder_split(item.title)

        # Persist tasks linked to this roadmap item
        ws_result = await session.execute(select(Workspace).where(Workspace.slug == _WORKSPACE_SLUG))
        workspace = ws_result.scalar_one_or_none()
        if workspace:
            for t in tasks:
                task = Task(
                    workspace_id=workspace.id,
                    project_id=project_id,
                    roadmap_item_id=item_id,
                    title=t.title,
                    body=t.body,
                    priority=t.priority,
                    status="backlog",
                )
                session.add(task)

        item.status = "ready"
        await session.commit()

        return SplitPreviewResponse(tasks=tasks)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception(
            "Roadmap split failed for project=%s item=%s",
            _sanitize_for_log(project_id),
            _sanitize_for_log(item_id),
        )
        await session.rollback()
        result = await session.execute(
            select(RoadmapItem).where(
                RoadmapItem.id == item_id,
                RoadmapItem.project_id == project_id,
            )
        )
        row = result.scalar_one_or_none()
        if row is not None:
            row.status = previous_status
            await session.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Splitting failed. Status was restored; you can try again.",
        ) from exc


def _sanitize_for_log(value) -> str:
    """
    Normalize values before logging to reduce the risk of log injection when
    logging user-controlled data.

    - Converts non-string values to their string representation.
    - Removes ASCII control characters (0x00–0x1F and 0x7F), including CR/LF,
      so the result is always a single logical line.
    - Normalizes whitespace and trims leading/trailing spaces to avoid
      visually confusing log entries.
    - Truncates very long values to a safe maximum length.
    """
    # Convert non-string values to string representation
    if not isinstance(value, str):
        value = str(value)

    # Remove ASCII control characters (0x00-0x1F and 0x7F), including \r and \n
    # to prevent forged or split log lines.
    sanitized = "".join(ch for ch in value if " " <= ch <= "~")

    # Normalize internal whitespace to single spaces and strip edges
    sanitized = " ".join(sanitized.split())

    # Guard against excessively long values in logs.
    max_len = 1000
    if len(sanitized) > max_len:
        sanitized = sanitized[:max_len] + "…"

    return sanitized


def _build_split_prompt(title: str, description: str) -> str:
    return (
        f"Feature title: {title}\n\n"
        f"Description:\n{description}\n\n"
        "Break this feature into concrete, actionable development tasks. "
        "Return ONLY a JSON array (no markdown, no explanation) of objects with fields: "
        '"title" (string, max 80 chars), "body" (string, detailed description, may be null), '
        '"priority" (one of: low, medium, high, urgent). '
        "Aim for 3–8 tasks. Example: "
        '[{"title": "Setup DB schema", "body": "Create migration for users table", "priority": "high"}]'
    )


async def _split_via_openrouter(
    prompt: str,
    model_name: str,
    instructions: str | None,
    api_key: str,
) -> list[SplitPreviewTask]:
    import httpx

    messages = []
    if instructions:
        messages.append({"role": "system", "content": instructions})
    else:
        messages.append({
            "role": "system",
            "content": "You are a project management assistant. Return only valid JSON arrays, no markdown fences.",
        })
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={"model": model_name, "messages": messages},
        )
        resp.raise_for_status()
        data = resp.json()

    content = data["choices"][0]["message"]["content"].strip()
    # Strip markdown code fences if the model adds them
    if content.startswith("```"):
        content = content.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    raw: list[dict] = json.loads(content)
    return [
        SplitPreviewTask(
            title=t.get("title", "Task"),
            body=t.get("body"),
            priority=t.get("priority", "medium"),
        )
        for t in raw
    ]


def _placeholder_split(title: str) -> list[SplitPreviewTask]:
    """Fallback when no API key is configured."""
    return [
        SplitPreviewTask(title=f"[Placeholder] Design: {title}", body="Define scope and acceptance criteria.", priority="high"),
        SplitPreviewTask(title=f"[Placeholder] Implement: {title}", body="Build the feature according to the design.", priority="high"),
        SplitPreviewTask(title=f"[Placeholder] Test: {title}", body="Write unit and integration tests.", priority="medium"),
    ]
