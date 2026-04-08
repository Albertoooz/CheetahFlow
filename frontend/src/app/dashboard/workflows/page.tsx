"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { workflowsApi } from "@/lib/api";
import type { WorkflowDefinition } from "@/types";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setWorkflows(await workflowsApi.list());
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this workflow?")) return;
    try {
      await workflowsApi.delete(id);
      await load();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Workflow Definitions"
        description="Ordered stage pipelines: agent steps and human gates."
        action={
          <Link href="/dashboard/workflows/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              New Workflow
            </Button>
          </Link>
        }
      />

      {loading && <p className="text-sm text-slate-500 mb-4">Loading…</p>}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {workflows.length === 0 && !error && !loading && (
          <div className="text-center py-12 text-slate-400 text-sm">
            <p className="mb-3">No workflows yet.</p>
            <Link href="/dashboard/workflows/new">
              <Button variant="secondary">Create your first workflow</Button>
            </Link>
          </div>
        )}
        {workflows.map((wf) => (
          <div
            key={wf.id}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{wf.name}</span>
              {wf.is_default && (
                <span className="text-xs bg-brand-500/10 text-brand-600 px-2 py-0.5 rounded-full">
                  default
                </span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Link href={`/dashboard/workflows/${wf.id}/edit`}>
                  <Button variant="secondary" className="h-8 px-3 text-xs flex items-center gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(wf.id)}
                  className="h-8 px-3 text-xs rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {wf.stages.map((stage, i) => (
                <div
                  key={stage.id}
                  className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5"
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 font-bold">
                    {i + 1}
                  </span>
                  <span className="font-medium">{stage.label || stage.id}</span>
                  <span
                    className={`px-1.5 rounded text-xs ${
                      stage.type === "human_gate"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {stage.type === "human_gate" ? "gate" : stage.executor}
                  </span>
                </div>
              ))}
              {wf.stages.length === 0 && (
                <span className="text-xs text-slate-400">No stages yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
