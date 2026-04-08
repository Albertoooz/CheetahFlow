"""Resume path: prior agent outputs load from WorkflowStep.output_summary."""

import pytest
from sqlalchemy import select

from agentflow.db.models import Task, WorkflowDefinition, WorkflowRun, WorkflowStep, Workspace
from agentflow.orchestration.runner import _load_prior_agent_outputs
from tests.conftest import TestSessionLocal


@pytest.mark.asyncio
async def test_load_prior_agent_outputs_after_human_gate():
    async with TestSessionLocal() as session:
        ws = (await session.execute(select(Workspace).where(Workspace.slug == "default"))).scalar_one()

        stages = [
            {"type": "agent", "id": "a1", "role_key": "coder", "executor": "openrouter", "label": "Code"},
            {"type": "human_gate", "id": "h1", "label": "Review"},
            {"type": "agent", "id": "a2", "role_key": "reviewer", "executor": "openrouter", "label": "Fix"},
        ]
        wf = WorkflowDefinition(
            workspace_id=ws.id,
            name="test-wf",
            stages=stages,
        )
        session.add(wf)
        await session.commit()
        await session.refresh(wf)

        task = Task(workspace_id=ws.id, title="T", body="body", workflow_definition_id=wf.id)
        session.add(task)
        await session.commit()
        await session.refresh(task)

        run_id = "run-resume-test"
        run = WorkflowRun(
            id=run_id,
            task_id=task.id,
            workflow_definition_id=wf.id,
            status="paused",
            current_stage_index=2,
        )
        session.add(run)
        await session.commit()

        session.add_all(
            [
                WorkflowStep(
                    run_id=run_id,
                    stage_index=0,
                    stage_id="a1",
                    role_key="coder",
                    executor="openrouter",
                    status="completed",
                    output_summary="first agent output for chain",
                ),
                WorkflowStep(
                    run_id=run_id,
                    stage_index=1,
                    stage_id="h1",
                    role_key=None,
                    executor="human_gate",
                    status="completed",
                    output_summary=None,
                ),
            ]
        )
        await session.commit()

        prior = await _load_prior_agent_outputs(session, run_id, stages, 2)
        assert prior == ["first agent output for chain"]


@pytest.mark.asyncio
async def test_load_prior_agent_outputs_fresh_run_empty():
    async with TestSessionLocal() as session:
        prior = await _load_prior_agent_outputs(session, "any", [], 0)
        assert prior == []
