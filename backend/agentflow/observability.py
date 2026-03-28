"""
Langfuse observability helpers.

Langfuse 4.x auto-initialises a background worker on import and tries to
reach cloud.langfuse.com even without valid keys, which hangs the startup.
To avoid this we only import langfuse when BOTH keys are present in the env.
When the keys are absent we expose lightweight stub implementations so all
import sites (`from agentflow.observability import observe, ...`) keep working.

Usage:
    from agentflow.observability import observe, propagate_attributes, langfuse_client

    @observe(name="my-step", as_type="span")
    async def my_step(...):
        ...
"""

import functools
import logging
import os
from contextlib import contextmanager

from agentflow.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Inject Langfuse env vars from settings so the SDK picks them up
# (allows running with .env rather than shell exports).
if settings.langfuse_secret_key:
    os.environ.setdefault("LANGFUSE_SECRET_KEY", settings.langfuse_secret_key)
if settings.langfuse_public_key:
    os.environ.setdefault("LANGFUSE_PUBLIC_KEY", settings.langfuse_public_key)
if settings.langfuse_base_url:
    os.environ.setdefault("LANGFUSE_BASE_URL", settings.langfuse_base_url)

_langfuse_enabled = bool(settings.langfuse_secret_key and settings.langfuse_public_key)


class _NoopLangfuseClient:
    def flush(self) -> None:
        pass


def _make_noop_observe():
    def observe(*args, **kwargs):  # type: ignore[misc]
        def decorator(fn):
            @functools.wraps(fn)
            async def wrapper(*a, **kw):
                return await fn(*a, **kw)
            return wrapper
        if args and callable(args[0]):
            return decorator(args[0])
        return decorator
    return observe


def _make_noop_propagate():
    @contextmanager
    def propagate_attributes(**_kwargs):  # type: ignore[misc]
        yield
    return propagate_attributes


if _langfuse_enabled:
    try:
        from langfuse import get_client
        from langfuse import observe, propagate_attributes  # noqa: F401

        langfuse_client = get_client()
        logger.info("Langfuse observability enabled (base_url=%s)", settings.langfuse_base_url)
    except ImportError:  # pragma: no cover
        logger.warning("langfuse package not installed; tracing is disabled")
        observe = _make_noop_observe()  # type: ignore[assignment]
        propagate_attributes = _make_noop_propagate()  # type: ignore[assignment]
        langfuse_client = _NoopLangfuseClient()  # type: ignore[assignment]
else:
    # Do NOT import langfuse — 4.x starts background workers on import that
    # attempt network connections even without valid credentials.
    logger.info("Langfuse observability disabled — set LANGFUSE_SECRET_KEY + LANGFUSE_PUBLIC_KEY to enable")
    observe = _make_noop_observe()  # type: ignore[assignment]
    propagate_attributes = _make_noop_propagate()  # type: ignore[assignment]
    langfuse_client = _NoopLangfuseClient()  # type: ignore[assignment]

__all__ = ["langfuse_client", "observe", "propagate_attributes"]
