"""Regression: duplicate role_key must not raise MultipleResultsFound."""

from datetime import datetime, timedelta

import pytest
from sqlalchemy import select

from agentflow.db.agent_lookup import get_enabled_agent_by_role_key
from agentflow.db.models import AgentConfig, Workspace
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_get_enabled_agent_by_role_key_picks_most_recent_when_duplicates():
    async with TestSessionLocal() as session:
        ws = (await session.execute(select(Workspace).where(Workspace.slug == "default"))).scalar_one()
        role = "dup_role_key"

        older = AgentConfig(
            workspace_id=ws.id,
            role_key=role,
            display_name="Older",
            model_name="openai/old",
        )
        newer = AgentConfig(
            workspace_id=ws.id,
            role_key=role,
            display_name="Newer",
            model_name="openai/new",
        )
        session.add_all([older, newer])
        await session.commit()
        await session.refresh(older)
        await session.refresh(newer)

        older.updated_at = datetime.utcnow() - timedelta(days=1)
        await session.commit()

        picked = await get_enabled_agent_by_role_key(session, role)
        assert picked is not None
        assert picked.model_name == "openai/new"


@pytest.mark.asyncio
async def test_get_enabled_agent_by_role_key_returns_none_when_only_disabled():
    """Duplicate role_keys that are all disabled must not match (no bogus row)."""
    async with TestSessionLocal() as session:
        ws = (await session.execute(select(Workspace).where(Workspace.slug == "default"))).scalar_one()
        role = "only_disabled"

        a = AgentConfig(
            workspace_id=ws.id,
            role_key=role,
            display_name="Off",
            model_name="openai/x",
            enabled=False,
        )
        b = AgentConfig(
            workspace_id=ws.id,
            role_key=role,
            display_name="Also off",
            model_name="openai/y",
            enabled=False,
        )
        session.add_all([a, b])
        await session.commit()

        picked = await get_enabled_agent_by_role_key(session, role)
        assert picked is None
