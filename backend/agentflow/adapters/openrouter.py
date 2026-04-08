"""OpenRouter adapter — calls OpenRouter via the OpenAI-compatible HTTP API."""

from __future__ import annotations

import logging

import httpx

from agentflow.adapters.base import AdapterResult, BaseAdapter
from agentflow.config import get_settings

logger = logging.getLogger(__name__)


class OpenRouterAdapter(BaseAdapter):
    name = "openrouter"

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
        settings = get_settings()

        if not settings.openrouter_api_key:
            logger.warning(
                "[openrouter-stub] OPENROUTER_API_KEY not set — returning stub. run=%s step=%s",
                run_id, step_id,
            )
            return AdapterResult(
                output=f"[STUB] OpenRouter response from {model_name} for role {role_key}",
                token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
                metadata={"stub": True},
            )

        messages: list[dict] = []
        if instructions:
            messages.append({"role": "system", "content": instructions})
        messages.append({"role": "user", "content": prompt})

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/Albertoooz/CheetahFlow",
                    "X-Title": "CheetahFlow",
                },
                json={
                    "model": model_name,
                    "messages": messages,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        content: str = data["choices"][0]["message"]["content"] or ""
        token_usage: dict = {}
        if usage := data.get("usage"):
            token_usage = {
                "prompt_tokens": usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
                "total_tokens": usage.get("total_tokens", 0),
            }

        logger.info(
            "[openrouter] run=%s step=%s role=%s model=%s tokens=%s",
            run_id, step_id, role_key, model_name, token_usage.get("total_tokens"),
        )
        return AdapterResult(output=content, token_usage=token_usage)
