import os

# Must be set before agentflow modules are imported so Settings picks them up
os.environ.setdefault("CHEETAHFLOW_DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("CHEETAHFLOW_ADMIN_TOKEN", "test-admin-token")

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from agentflow.db.models import Base, Workspace
from agentflow.db.session import get_session
from agentflow.main import app

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False)


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestSessionLocal() as session:
        session.add(Workspace(slug="default"))
        await session.commit()
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    async def override_session():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


ADMIN_HEADERS = {"X-Admin-Token": "test-admin-token"}
