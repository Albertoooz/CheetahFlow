"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { agentsApi } from "@/lib/api";
import type { AgentConfig } from "@/types";
import { AgentForm } from "./AgentForm";

export function AgentList() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AgentConfig | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setAgents(await agentsApi.list());
      setToast(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await agentsApi.delete(deleteTarget.id);
      await refresh();
      setDeleteTarget(null);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-slate-500">Loading agents…</p>}

      {toast && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{toast}</div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          New agent
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              setEditing(agent);
              setFormOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setEditing(agent);
                setFormOpen(true);
              }
            }}
            className="group relative rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-500/40 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900 truncate">{agent.display_name}</span>
                  <Badge>{agent.role_key}</Badge>
                  {!agent.enabled && (
                    <Badge tone="neutral" className="bg-slate-200 text-slate-500">
                      disabled
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-slate-500 truncate">
                  {agent.model_provider} / {agent.model_name}
                </div>
              </div>
              <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(agent);
                    setFormOpen(true);
                  }}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(agent);
                  }}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AgentForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        agent={editing}
        onSaved={refresh}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete agent" size="sm">
        <p className="text-sm text-slate-600 mb-4">
          Remove <strong>{deleteTarget?.display_name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void confirmDelete()} disabled={busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
