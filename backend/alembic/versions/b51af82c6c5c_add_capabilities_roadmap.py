"""add_capabilities_roadmap

Revision ID: b51af82c6c5c
Revises: b2c9d4e5f6a1
Create Date: 2026-04-07 22:07:27.255436

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "b51af82c6c5c"
down_revision: str | None = "b2c9d4e5f6a1"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "roadmap_items",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("project_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_roadmap_items_project_id"), "roadmap_items", ["project_id"], unique=False)

    # capabilities default [] for existing rows
    op.add_column("agent_configs", sa.Column("capabilities", sa.JSON(), nullable=False, server_default="[]"))

    op.add_column("tasks", sa.Column("roadmap_item_id", sa.String(), nullable=True))
    op.create_index(op.f("ix_tasks_roadmap_item_id"), "tasks", ["roadmap_item_id"], unique=False)

    # SQLite requires batch mode for foreign key creation
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("tasks") as batch_op:
            batch_op.create_foreign_key(
                "fk_tasks_roadmap_item_id",
                "roadmap_items",
                ["roadmap_item_id"],
                ["id"],
                ondelete="SET NULL",
            )
    else:
        op.create_foreign_key(
            "fk_tasks_roadmap_item_id",
            "tasks",
            "roadmap_items",
            ["roadmap_item_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("tasks") as batch_op:
            batch_op.drop_constraint("fk_tasks_roadmap_item_id", type_="foreignkey")
    else:
        op.drop_constraint("fk_tasks_roadmap_item_id", "tasks", type_="foreignkey")

    op.drop_index(op.f("ix_tasks_roadmap_item_id"), table_name="tasks")
    op.drop_column("tasks", "roadmap_item_id")
    op.drop_column("agent_configs", "capabilities")
    op.drop_index(op.f("ix_roadmap_items_project_id"), table_name="roadmap_items")
    op.drop_table("roadmap_items")
