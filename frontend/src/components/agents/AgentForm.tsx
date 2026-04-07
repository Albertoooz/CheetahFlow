"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { agentsApi } from "@/lib/api";
import type { AgentConfig } from "@/types";
import { ModelSelector } from "./ModelSelector";

const CAPABILITY_OPTIONS = [
  "architecture",
  "code",
  "review",
  "testing",
  "documentation",
  "planning",
  "devops",
  "security",
];

const PRESETS: {
  label: string;
  role_key: string;
  display_name: string;
  model_name: string;
  model_provider: string;
  capabilities: string[];
  instructions: string;
}[] = [
  {
    label: "Architect",
    role_key: "architect",
    display_name: "Architect",
    model_name: "openai/gpt-4o",
    model_provider: "openrouter",
    capabilities: ["architecture", "planning"],
    instructions:
      "You are a senior software architect. Analyze requirements, identify key design decisions, define interfaces and module boundaries. Produce clear architectural diagrams or descriptions. Prioritize simplicity, maintainability, and scalability.",
  },
  {
    label: "Developer",
    role_key: "developer",
    display_name: "Developer",
    model_name: "openai/gpt-4o-mini",
    model_provider: "openrouter",
    capabilities: ["code"],
    instructions:
      "You are an expert software developer. Write clean, well-tested code following the project conventions. Implement the task described. Return only the relevant code changes or file contents.",
  },
  {
    label: "Tester",
    role_key: "tester",
    display_name: "Tester",
    model_name: "openai/gpt-4o-mini",
    model_provider: "openrouter",
    capabilities: ["testing"],
    instructions:
      "You are a QA engineer. Write comprehensive unit and integration tests for the given code. Cover edge cases, error paths, and happy paths. Use pytest conventions.",
  },
  {
    label: "Code Reviewer",
    role_key: "reviewer",
    display_name: "Code Reviewer",
    model_name: "anthropic/claude-3.5-sonnet",
    model_provider: "openrouter",
    capabilities: ["review", "security"],
    instructions:
      "You are a senior code reviewer. Review the provided code for correctness, security vulnerabilities, performance issues, and adherence to best practices. Provide actionable, specific feedback.",
  },
  {
    label: "Task Splitter",
    role_key: "task_splitter",
    display_name: "Task Splitter",
    model_name: "openai/gpt-4o-mini",
    model_provider: "openrouter",
    capabilities: ["planning"],
    instructions:
      "You are a project management assistant. Given a feature description, break it into concrete, actionable development tasks. Return ONLY a valid JSON array with no markdown fences. Each object must have: title (string), body (string or null), priority (low|medium|high|urgent).",
  },
];

export function AgentForm({
  open,
  onClose,
  agent,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  agent: AgentConfig | null;
  onSaved: () => void;
}) {
  const [roleKey, setRoleKey] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [provider, setProvider] = useState("openrouter");
  const [modelName, setModelName] = useState("openai/gpt-4o-mini");
  const [instructions, setInstructions] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (agent) {
      setRoleKey(agent.role_key);
      setDisplayName(agent.display_name);
      setProvider(agent.model_provider);
      setModelName(agent.model_name);
      setInstructions(agent.instructions ?? "");
      setCapabilities(agent.capabilities ?? []);
      setEnabled(agent.enabled);
    } else {
      setRoleKey("");
      setDisplayName("");
      setProvider("openrouter");
      setModelName("openai/gpt-4o-mini");
      setInstructions("");
      setCapabilities([]);
      setEnabled(true);
    }
  }, [open, agent]);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    if (!agent) {
      setRoleKey(preset.role_key);
      setDisplayName(preset.display_name);
    }
    setProvider(preset.model_provider);
    setModelName(preset.model_name);
    setCapabilities(preset.capabilities);
    setInstructions(preset.instructions);
  }

  function toggleCapability(cap: string) {
    setCapabilities((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (agent) {
        await agentsApi.update(agent.id, {
          display_name: displayName,
          model_provider: provider,
          model_name: modelName,
          instructions: instructions || null,
          capabilities,
          enabled,
        });
      } else {
        if (!roleKey.trim() || !displayName.trim()) {
          setError("Role key and display name are required.");
          setSaving(false);
          return;
        }
        await agentsApi.create({
          role_key: roleKey.trim().toLowerCase().replace(/\s+/g, "_"),
          display_name: displayName.trim(),
          model_provider: provider,
          model_name: modelName,
          instructions: instructions || null,
          capabilities,
          enabled,
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={agent ? "Edit agent" : "New agent"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Presets */}
        {!agent && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.role_key}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:border-brand-400 hover:bg-brand-50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Role key</label>
            <Input
              value={roleKey}
              onChange={(e) => setRoleKey(e.target.value)}
              disabled={!!agent}
              placeholder="e.g. planner"
              required={!agent}
            />
            {agent && <p className="text-xs text-slate-400 mt-1">Role key cannot be changed.</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Display name</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
        </div>

        <ModelSelector
          provider={provider}
          modelName={modelName}
          onProviderChange={setProvider}
          onModelNameChange={setModelName}
        />

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-2">Capabilities</label>
          <div className="flex flex-wrap gap-2">
            {CAPABILITY_OPTIONS.map((cap) => (
              <button
                key={cap}
                type="button"
                onClick={() => toggleCapability(cap)}
                className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                  capabilities.includes(cap)
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-slate-200 text-slate-600 hover:border-brand-400"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            System instructions
          </label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="System / role instructions for this agent…"
            rows={6}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enabled
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
