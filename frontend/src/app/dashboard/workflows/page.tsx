"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Workflow Definitions"
        description="Ordered stage pipelines: agent steps and human gates."
      />

      {loading && <p className="text-sm text-slate-500 mb-4">Loading…</p>}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load workflows: {error}
        </div>
      )}

      <div className="space-y-4">
        {workflows.length === 0 && !error && !loading && (
          <p className="text-slate-400 text-sm py-8 text-center">No workflows defined yet.</p>
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
