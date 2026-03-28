"""Base class for all executor adapters.

To add a new adapter (e.g. a new LLM provider or tool):
1. Create a new file under agentflow/adapters/my_adapter.py
2. Subclass BaseAdapter and implement execute()
3. Register it in agentflow/adapters/registry.py
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AdapterResult:
    """Structured result returned by every adapter."""

    output: str
    token_usage: dict[str, Any] = field(default_factory=dict)
    # Langfuse observation ID if the adapter created one
    langfuse_observation_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseAdapter(ABC):
    """Every executor adapter must subclass this."""

    name: str  # Must match the "executor" field in workflow stages

    @abstractmethod
    async def execute(
        self,
        *,
        role_key: str,
        model_name: str,
        instructions: str | None,
        prompt: str,
        run_id: str,
        step_id: str,
        trace_id: str | None = None,
    ) -> AdapterResult:
        """Run the stage and return a structured result.

        Args:
            role_key: Agent role (e.g. "planner").
            model_name: Model identifier (e.g. "openai/gpt-4o-mini").
            instructions: Optional system instructions from agent config.
            prompt: The assembled user prompt for this step.
            run_id: Parent WorkflowRun ID (for logging/tracing).
            step_id: WorkflowStep ID (for logging/tracing).
            trace_id: Langfuse trace ID to attach spans to.
        """
