"""OpenRouter adapter — calls OpenRouter via the OpenAI-compatible API.

Langfuse tracing is applied via the langfuse.openai drop-in wrapper so every
LLM call is automatically recorded as a generation under the active trace.

Phase B TODO:
- Implement real API call (currently stub)
- Handle streaming responses
- Propagate token usage from OpenRouter's usage accounting
"""

from __future__ import annotations

import logging

from agentflow.adapters.base import AdapterResult, BaseAdapter

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
        """
        Phase B implementation outline:

        from agentflow.config import get_settings
        from langfuse.openai import openai as lf_openai

        settings = get_settings()
        client = lf_openai.AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        messages = []
        if instructions:
            messages.append({"role": "system", "content": instructions})
        messages.append({"role": "user", "content": prompt})

        response = await client.chat.completions.create(
            model=model_name,
            messages=messages,
            extra_body={"usage": {"include": True}},
            name=f"{role_key}-step",
        )
        content = response.choices[0].message.content or ""
        usage = {}
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        return AdapterResult(output=content, token_usage=usage)
        """
        logger.info("[openrouter-stub] run=%s step=%s role=%s model=%s", run_id, step_id, role_key, model_name)
        return AdapterResult(
            output=f"[STUB] OpenRouter response from {model_name} for role {role_key}",
            token_usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            metadata={"stub": True},
        )
