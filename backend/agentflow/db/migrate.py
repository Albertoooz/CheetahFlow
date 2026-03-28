"""Run Alembic migrations on startup (sync engine).

`Base.metadata.create_all()` does not ALTER existing tables, so schema drift
(e.g. old SQLite files) causes 500s when ORM expects new columns. Migrations
must be applied.
"""

from __future__ import annotations

import logging
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from sqlalchemy import create_engine, inspect

from agentflow.config import get_settings
from alembic import command

logger = logging.getLogger(__name__)

INITIAL_REVISION = "411552a3ef67"


def _sync_database_url() -> str:
    url = get_settings().database_url
    return (
        url.replace("sqlite+aiosqlite", "sqlite")
        .replace("postgresql+asyncpg", "postgresql+psycopg2")
    )


def run_alembic_upgrade() -> None:
    """Apply all pending migrations. Stamps initial revision if DB exists without alembic_version."""
    backend_root = Path(__file__).resolve().parents[2]
    script = backend_root / "alembic"

    # Build Config without pointing at alembic.ini — env.py's
    # fileConfig(config.config_file_name) resets the root logger to WARNING
    # which swallows uvicorn's "Application startup complete" and all INFO logs.
    cfg = Config()
    cfg.set_main_option("script_location", str(script))
    sync_url = _sync_database_url()
    cfg.set_main_option("sqlalchemy.url", sync_url)

    engine = create_engine(sync_url)
    should_stamp = False
    with engine.connect() as conn:
        context = MigrationContext.configure(conn)
        if context.get_current_revision() is None and "workspaces" in inspect(conn).get_table_names():
            logger.info(
                "Database has tables but no alembic version; stamping %s then upgrading",
                INITIAL_REVISION,
            )
            should_stamp = True
    engine.dispose()

    if should_stamp:
        command.stamp(cfg, INITIAL_REVISION)

    command.upgrade(cfg, "head")
