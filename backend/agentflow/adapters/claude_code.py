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


def _claude_subprocess_env() -> dict[str, str]:
    """Build env for the Claude CLI child process.

    Do **not** pass the full ``os.environ``: the CLI handles user-influenced
    prompts, and exposing CheetahFlow secrets (``CHEETAHFLOW_*`` DB URL, admin
    token, app API keys, Langfuse keys) would allow exfiltration. We allowlist
    only locale/path/OS plumbing plus Anthropic credentials the CLI needs.
    """
    safe_keys = {
        "PATH",
        "HOME",
        "USER",
        "LOGNAME",
        "SHELL",
        "LANG",
        "LC_ALL",
        "LC_CTYPE",
        "TERM",
        "TMPDIR",
        "TZ",
        "XDG_CONFIG_HOME",
        "XDG_CACHE_HOME",
        "XDG_DATA_HOME",
    }
    if os.name == "nt":
        safe_keys |= {
            "SYSTEMROOT",
            "WINDIR",
            "PATHEXT",
            "COMSPEC",
            "USERPROFILE",
            "APPDATA",
            "LOCALAPPDATA",
        }

    out: dict[str, str] = {"CLAUDE_NO_COLOR": "1"}
    for key in safe_keys:
        val = os.environ.get(key)
        if val is not None:
            out[key] = val
    for key in ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL"):
        val = os.environ.get(key)
        if val is not None:
            out[key] = val
    return out


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
                env=_claude_subprocess_env(),
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
