"""
Langfuse observability helpers.

The SDK reads LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY and LANGFUSE_BASE_URL
from the environment.  When those variables are absent the SDK acts as a no-op
so the app works without any Langfuse infrastructure during local development.

Usage:
    from agentflow.observability import observe, propagate_attributes, langfuse_client

    @observe(name="my-step", as_type="span")
    async def my_step(...):
        ...
"""

import logging
import os

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

try:
    from langfuse import get_client, observe, propagate_attributes  # noqa: F401

    langfuse_client = get_client()

    if _langfuse_enabled:
        logger.info("Langfuse observability enabled (base_url=%s)", settings.langfuse_base_url)
    else:
        logger.info(
            "Langfuse observability disabled — set LANGFUSE_SECRET_KEY + "
            "LANGFUSE_PUBLIC_KEY to enable tracing"
        )
except ImportError:  # pragma: no cover
    # langfuse not installed — provide harmless stubs
    import functools
    from contextlib import contextmanager

    logger.warning("langfuse package not installed; tracing is disabled")

    def observe(*args, **kwargs):  # type: ignore[misc]
        def decorator(fn):
            @functools.wraps(fn)
            async def wrapper(*a, **kw):
                return await fn(*a, **kw)

            return wrapper

        if args and callable(args[0]):
            return decorator(args[0])
        return decorator

    @contextmanager
    def propagate_attributes(**kwargs):  # type: ignore[misc]
        yield

    class _NoopClient:
        def flush(self) -> None:
            pass

    langfuse_client = _NoopClient()  # type: ignore[assignment]
