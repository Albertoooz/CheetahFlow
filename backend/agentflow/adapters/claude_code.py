"""Claude Code adapter — runs the `claude` CLI as a subprocess.

Requires the Anthropic Claude Code CLI to be installed on the machine running
the worker. Operators must satisfy Anthropic terms of service.

Phase B TODO:
- Implement real subprocess call with timeout + sandbox cwd
- Parse JSON output from `claude --output-format json`
- Redact sensitive content from logs
- Add Langfuse span for subprocess duration
"""

from __future__ import annotations

import logging

from agentflow.adapters.base import AdapterResult, BaseAdapter

logger = logging.getLogger(__name__)


class ClaudeCodeAdapter(BaseAdapter):
    name = "claude_code"

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
        """
        Phase B implementation outline:

        import asyncio, json, shlex
        from agentflow.observability import langfuse_client, observe

        cmd = ["claude", "--output-format", "json", "--print", prompt]
        if instructions:
            cmd += ["--system-prompt", instructions]

        # Run with timeout to prevent runaway subprocesses
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=cwd,  # sandboxed working directory from task config
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=300)
        except asyncio.TimeoutError:
            proc.kill()
            raise RuntimeError("Claude Code subprocess timed out after 300s")

        data = json.loads(stdout)
        return AdapterResult(
            output=data.get("result", ""),
            metadata={"exit_code": proc.returncode},
        )
        """
        logger.info("[claude-code-stub] run=%s step=%s role=%s", run_id, step_id, role_key)
        return AdapterResult(
            output=f"[STUB] Claude Code response for role {role_key}",
            token_usage={},
            metadata={"stub": True},
        )
