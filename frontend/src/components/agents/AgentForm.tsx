"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { agentsApi } from "@/lib/api";
import type { AgentConfig } from "@/types";
import { ModelSelector } from "./ModelSelector";

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
      setEnabled(agent.enabled);
    } else {
      setRoleKey("");
      setDisplayName("");
      setProvider("openrouter");
      setModelName("openai/gpt-4o-mini");
      setInstructions("");
      setEnabled(true);
    }
  }, [open, agent]);

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
          <label className="block text-xs font-medium text-slate-500 mb-1">Instructions</label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="System / role instructions for this agent…"
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
