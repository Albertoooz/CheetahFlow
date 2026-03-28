"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const OPENROUTER_SUGGESTIONS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3-haiku",
  "google/gemini-2.0-flash-001",
];

export function ModelSelector({
  provider,
  modelName,
  onProviderChange,
  onModelNameChange,
  disabled,
}: {
  provider: string;
  modelName: string;
  onProviderChange: (v: string) => void;
  onModelNameChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Provider</label>
        <Select
          value={provider}
          disabled={disabled}
          onChange={(e) => onProviderChange(e.target.value)}
        >
          <option value="openrouter">OpenRouter</option>
          <option value="claude_code">Claude Code (local)</option>
        </Select>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
        <Input
          list="model-suggestions"
          value={modelName}
          disabled={disabled}
          onChange={(e) => onModelNameChange(e.target.value)}
          placeholder="Model id"
        />
        <datalist id="model-suggestions">
          {OPENROUTER_SUGGESTIONS.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
