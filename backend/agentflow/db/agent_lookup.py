"""Helpers for resolving AgentConfig rows when duplicate role_keys may exist."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agentflow.db.models import AgentConfig


async def get_enabled_agent_by_role_key(
    session: AsyncSession,
    role_key: str,
) -> AgentConfig | None:
    """Return the most recently updated enabled agent for ``role_key``, or None.

    ``role_key`` is not unique; duplicates are allowed. We pick a deterministic
    row (latest ``updated_at``, then ``id``) so callers never hit
    ``MultipleResultsFound`` from ``scalar_one_or_none()``.
    """
    result = await session.execute(
        select(AgentConfig)
        .where(
            AgentConfig.role_key == role_key,
            AgentConfig.enabled == True,  # noqa: E712
        )
        .order_by(AgentConfig.updated_at.desc(), AgentConfig.id.desc())
        .limit(1)
    )
    return result.scalars().first()
