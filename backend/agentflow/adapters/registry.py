"""Adapter registry — maps executor name -> adapter instance.

When Phase B adapters are implemented, import and register them here.
"""

from __future__ import annotations

from agentflow.adapters.base import BaseAdapter
from agentflow.adapters.claude_code import ClaudeCodeAdapter
from agentflow.adapters.openrouter import OpenRouterAdapter


class AdapterRegistry:
    def __init__(self) -> None:
        self._adapters: dict[str, BaseAdapter] = {}

    def register(self, adapter: BaseAdapter) -> None:
        self._adapters[adapter.name] = adapter

    def get(self, name: str) -> BaseAdapter:
        adapter = self._adapters.get(name)
        if adapter is None:
            available = list(self._adapters.keys())
            raise KeyError(f"No adapter registered for executor {name!r}. Available: {available}")
        return adapter

    def available(self) -> list[str]:
        return list(self._adapters.keys())


adapter_registry = AdapterRegistry()
adapter_registry.register(OpenRouterAdapter())
adapter_registry.register(ClaudeCodeAdapter())
