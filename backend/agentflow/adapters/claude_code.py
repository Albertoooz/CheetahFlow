"""Claude Code adapter — runs the `claude` CLI as a subprocess.

Requires the Anthropic Claude Code CLI (`claude`) to be installed.
Operators must satisfy Anthropic terms of service.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import tempfile

from agentflow.adapters.base import AdapterResult, BaseAdapter

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 300  # seconds


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
        cmd = ["claude", "--output-format", "json", "--print", prompt]
        if instructions:
            cmd += ["--system-prompt", instructions]

        # Use a per-step temp dir as sandbox cwd so the subprocess cannot
        # accidentally modify the application working directory.
        with tempfile.TemporaryDirectory(prefix=f"cf_step_{step_id[:8]}_") as sandbox_cwd:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=sandbox_cwd,
                env={**os.environ, "CLAUDE_NO_COLOR": "1"},
            )
            try:
                stdout, stderr = await asyncio.wait_for(
                    proc.communicate(), timeout=_DEFAULT_TIMEOUT
                )
            except TimeoutError as exc:
                proc.kill()
                await proc.communicate()
                raise RuntimeError(
                    f"Claude Code subprocess timed out after {_DEFAULT_TIMEOUT}s"
                ) from exc

        if proc.returncode != 0:
            err = (stderr or b"").decode(errors="replace")[:500]
            raise RuntimeError(f"claude exited with code {proc.returncode}: {err}")

        raw = (stdout or b"").decode(errors="replace")
        try:
            data = json.loads(raw)
            output = data.get("result") or data.get("content") or raw
        except json.JSONDecodeError:
            output = raw

        logger.info("[claude-code] run=%s step=%s role=%s exit=%s", run_id, step_id, role_key, proc.returncode)
        return AdapterResult(
            output=output,
            token_usage={},
            metadata={"exit_code": proc.returncode},
        )
