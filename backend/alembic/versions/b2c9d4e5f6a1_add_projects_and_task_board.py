"""add projects and task board fields

Revision ID: b2c9d4e5f6a1
Revises: 411552a3ef67
Create Date: 2026-03-29 12:00:00.000000

Idempotent: safe if SQLAlchemy create_all partially created tables/columns.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

revision: str = "b2c9d4e5f6a1"
down_revision: str | None = "411552a3ef67"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_exists(bind, name: str) -> bool:
    return name in inspect(bind).get_table_names()


def _task_columns(bind) -> set[str]:
    if not _table_exists(bind, "tasks"):
        return set()
    return {c["name"] for c in inspect(bind).get_columns("tasks")}


def upgrade() -> None:
    bind = op.get_bind()

    if not _table_exists(bind, "projects"):
        op.create_table(
            "projects",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("workspace_id", sa.String(), nullable=False),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("columns", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"]),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(op.f("ix_projects_workspace_id"), "projects", ["workspace_id"], unique=False)

    cols = _task_columns(bind)
    if "project_id" not in cols:
        op.add_column("tasks", sa.Column("project_id", sa.String(), nullable=True))
    if "status" not in cols:
        op.add_column(
            "tasks",
            sa.Column("status", sa.String(), nullable=False, server_default="backlog"),
        )
    if "position" not in cols:
        op.add_column(
            "tasks",
            sa.Column("position", sa.Float(), nullable=False, server_default="0"),
        )
    if "priority" not in cols:
        op.add_column(
            "tasks",
            sa.Column("priority", sa.String(), nullable=False, server_default="medium"),
        )
    if "assignee_type" not in cols:
        op.add_column("tasks", sa.Column("assignee_type", sa.String(), nullable=True))
    if "assignee_agent_id" not in cols:
        op.add_column("tasks", sa.Column("assignee_agent_id", sa.String(), nullable=True))
    if "assignee_human_name" not in cols:
        op.add_column("tasks", sa.Column("assignee_human_name", sa.String(), nullable=True))
    if "reviewer_type" not in cols:
        op.add_column("tasks", sa.Column("reviewer_type", sa.String(), nullable=True))
    if "reviewer_agent_id" not in cols:
        op.add_column("tasks", sa.Column("reviewer_agent_id", sa.String(), nullable=True))
    if "reviewer_human_name" not in cols:
        op.add_column("tasks", sa.Column("reviewer_human_name", sa.String(), nullable=True))

    if _table_exists(bind, "tasks"):
        insp = inspect(bind)
        ix_names = {i["name"] for i in insp.get_indexes("tasks") if i.get("name")}
        if "ix_tasks_project_id" not in ix_names and "project_id" in _task_columns(bind):
            op.create_index(op.f("ix_tasks_project_id"), "tasks", ["project_id"], unique=False)
        if "ix_tasks_status" not in ix_names and "status" in _task_columns(bind):
            op.create_index(op.f("ix_tasks_status"), "tasks", ["status"], unique=False)

        fk_names = set()
        for fk in insp.get_foreign_keys("tasks"):
            n = fk.get("name")
            if n:
                fk_names.add(n)

        need_project_fk = (
            "fk_tasks_project_id_projects" not in fk_names and _table_exists(bind, "projects")
        )
        need_assignee_fk = "fk_tasks_assignee_agent_id_agent_configs" not in fk_names
        need_reviewer_fk = "fk_tasks_reviewer_agent_id_agent_configs" not in fk_names

        # SQLite cannot ALTER ADD CONSTRAINT; batch mode rebuilds the table.
        if bind.dialect.name == "sqlite" and (need_project_fk or need_assignee_fk or need_reviewer_fk):
            with op.batch_alter_table("tasks") as batch_op:
                if need_project_fk:
                    batch_op.create_foreign_key(
                        "fk_tasks_project_id_projects",
                        "projects",
                        ["project_id"],
                        ["id"],
                        ondelete="SET NULL",
                    )
                if need_assignee_fk:
                    batch_op.create_foreign_key(
                        "fk_tasks_assignee_agent_id_agent_configs",
                        "agent_configs",
                        ["assignee_agent_id"],
                        ["id"],
                    )
                if need_reviewer_fk:
                    batch_op.create_foreign_key(
                        "fk_tasks_reviewer_agent_id_agent_configs",
                        "agent_configs",
                        ["reviewer_agent_id"],
                        ["id"],
                    )
        elif bind.dialect.name != "sqlite":
            if need_project_fk:
                op.create_foreign_key(
                    "fk_tasks_project_id_projects",
                    "tasks",
                    "projects",
                    ["project_id"],
                    ["id"],
                    ondelete="SET NULL",
                )
            if need_assignee_fk:
                op.create_foreign_key(
                    "fk_tasks_assignee_agent_id_agent_configs",
                    "tasks",
                    "agent_configs",
                    ["assignee_agent_id"],
                    ["id"],
                )
            if need_reviewer_fk:
                op.create_foreign_key(
                    "fk_tasks_reviewer_agent_id_agent_configs",
                    "tasks",
                    "agent_configs",
                    ["reviewer_agent_id"],
                    ["id"],
                )


def downgrade() -> None:
    op.drop_constraint("fk_tasks_reviewer_agent_id_agent_configs", "tasks", type_="foreignkey")
    op.drop_constraint("fk_tasks_assignee_agent_id_agent_configs", "tasks", type_="foreignkey")
    op.drop_constraint("fk_tasks_project_id_projects", "tasks", type_="foreignkey")
    op.drop_index(op.f("ix_tasks_status"), table_name="tasks")
    op.drop_index(op.f("ix_tasks_project_id"), table_name="tasks")
    op.drop_column("tasks", "reviewer_human_name")
    op.drop_column("tasks", "reviewer_agent_id")
    op.drop_column("tasks", "reviewer_type")
    op.drop_column("tasks", "assignee_human_name")
    op.drop_column("tasks", "assignee_agent_id")
    op.drop_column("tasks", "assignee_type")
    op.drop_column("tasks", "priority")
    op.drop_column("tasks", "position")
    op.drop_column("tasks", "status")
    op.drop_column("tasks", "project_id")
    op.drop_index(op.f("ix_projects_workspace_id"), table_name="projects")
    op.drop_table("projects")
