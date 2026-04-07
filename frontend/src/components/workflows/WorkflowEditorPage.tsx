"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { agentsApi, workflowsApi } from "@/lib/api";
import type { AgentConfig, Stage, WorkflowDefinition } from "@/types";
import { WorkflowCanvas } from "./WorkflowCanvas";

interface WorkflowEditorPageProps {
  workflowId?: string;
}

export function WorkflowEditorPage({ workflowId }: WorkflowEditorPageProps) {
  const router = useRouter();
  const isNew = !workflowId;

  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  const load = useCallback(async () => {
    try {
      const [agentList, wfList] = await Promise.all([
        agentsApi.list(),
        isNew ? Promise.resolve([] as WorkflowDefinition[]) : workflowsApi.list(),
      ]);
      setAgents(agentList);
      if (!isNew) {
        const wf = wfList.find((w) => w.id === workflowId);
        if (wf) {
          setName(wf.name);
          setIsDefault(wf.is_default);
          setStages(wf.stages);
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [isNew, workflowId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workflow name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        await workflowsApi.create({ name: name.trim(), is_default: isDefault, stages });
      } else {
        await workflowsApi.update(workflowId!, { name: name.trim(), is_default: isDefault, stages });
      }
      router.push("/dashboard/workflows");
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="p-8 text-sm text-slate-500">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title={isNew ? "New Workflow" : "Edit Workflow"}
        description="Define the pipeline stages for this workflow."
      />
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Code Review Pipeline"
              required
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 self-end pb-2">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-brand-600"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Default workflow
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-3">Pipeline stages</label>
          <WorkflowCanvas stages={stages} agents={agents} onChange={setStages} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create workflow" : "Save changes"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/workflows")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
