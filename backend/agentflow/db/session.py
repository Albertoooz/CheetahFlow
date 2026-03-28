from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from agentflow.config import get_settings

_settings = get_settings()

_sqlite_connect = (
    {"check_same_thread": False, "timeout": 60.0}
    if "sqlite" in _settings.database_url
    else {}
)

engine = create_async_engine(
    _settings.database_url,
    echo=False,
    connect_args=_sqlite_connect,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a database session."""
    async with AsyncSessionLocal() as session:
        yield session
