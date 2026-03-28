"""Workflow runner — linear pipeline orchestrator (Phase A stub, Phase B: LangGraph).

Each run iterates through workflow stages in order:
- agent stages → dispatched to the appropriate adapter
- human_gate stages → run paused, waiting for /resume endpoint

Every step is recorded in workflow_steps.  Langfuse tracing wraps the entire
run and each individual step so the observability dashboard shows a full trace
hierarchy: run → steps → LLM generations.

Phase B TODO:
- Replace simple loop with LangGraph graph (enables checkpointing + resumption)
- Pass actual task body / context as the prompt
- Build prompt from prior step outputs (chain context)
"""

from __future__ import annotations

import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from agentflow.adapters import AdapterResult, adapter_registry
from agentflow.db.models import WorkflowRun, WorkflowStep
from agentflow.db.session import AsyncSessionLocal
from agentflow.observability import observe, propagate_attributes

logger = logging.getLogger(__name__)


async def run_workflow_background(run_id: str) -> None:
    """Entry point called via FastAPI BackgroundTasks."""
    try:
        await _execute_run(run_id)
    except Exception:
        logger.exception("Unhandled error in workflow run %s", run_id)


@observe(name="workflow-run")
async def _execute_run(run_id: str) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(WorkflowRun)
            .where(WorkflowRun.id == run_id)
            .options(selectinload(WorkflowRun.steps), selectinload(WorkflowRun.definition), selectinload(WorkflowRun.task))
        )
        run = result.scalar_one_or_none()
        if run is None:
            logger.error("Run %s not found", run_id)
            return

        stages = run.definition.stages or []
        task = run.task

        # Propagate metadata to all child Langfuse spans
        with propagate_attributes(
            session_id=f"run-{run_id}",
            metadata={
                "workflow": run.definition.name,
                "task_title": task.title,
                "run_id": run_id,
            },
        ):
            run.status = "running"
            await session.commit()

            start_index = run.current_stage_index

            for idx, stage in enumerate(stages):
                if idx < start_index:
                    continue

                stage_type = stage.get("type")
                stage_id = stage.get("id", str(idx))

                # Create step record
                step = WorkflowStep(
                    run_id=run_id,
                    stage_index=idx,
                    stage_id=stage_id,
                    role_key=stage.get("role_key"),
                    executor=stage.get("executor") if stage_type == "agent" else "human_gate",
                    status="running",
                    started_at=datetime.utcnow(),
                )
                session.add(step)
                run.current_stage_index = idx
                await session.commit()
                await session.refresh(step)

                if stage_type == "human_gate":
                    step.status = "completed"
                    step.finished_at = datetime.utcnow()
                    run.status = "paused"
                    await session.commit()
                    logger.info("Run %s paused at human_gate stage %s", run_id, stage_id)
                    return

                if stage_type == "agent":
                    try:
                        result_data = await _run_agent_step(
                            stage=stage,
                            task_prompt=task.body or task.title,
                            run_id=run_id,
                            step_id=step.id,
                        )
                        step.status = "completed"
                        step.output_summary = result_data.output[:2000]  # truncate for DB
                        step.token_usage = result_data.token_usage
                        step.langfuse_observation_id = result_data.langfuse_observation_id
                        step.finished_at = datetime.utcnow()
                    except Exception as exc:
                        step.status = "failed"
                        step.error_message = str(exc)[:500]
                        step.finished_at = datetime.utcnow()
                        run.status = "failed"
                        await session.commit()
                        logger.exception("Step %s failed in run %s", step.id, run_id)
                        return

                    await session.commit()

            run.status = "completed"
            await session.commit()
            logger.info("Run %s completed successfully", run_id)


@observe(name="agent-step", as_type="span")
async def _run_agent_step(
    *,
    stage: dict,
    task_prompt: str,
    run_id: str,
    step_id: str,
) -> AdapterResult:
    """Dispatch a single agent stage to its adapter."""
    executor = stage.get("executor", "openrouter")
    role_key = stage.get("role_key", "unknown")
    adapter = adapter_registry.get(executor)

    # In Phase B: look up AgentConfig for this role_key and get model_name + instructions
    model_name = "openai/gpt-4o-mini"
    instructions = None

    return await adapter.execute(
        role_key=role_key,
        model_name=model_name,
        instructions=instructions,
        prompt=task_prompt,
        run_id=run_id,
        step_id=step_id,
    )
