"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Scissors, ListTodo } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { roadmapApi } from "@/lib/api";
import type { RoadmapItem, SplitPreviewTask } from "@/types";
import { RoadmapItemForm } from "./RoadmapItemForm";
import { SplitPreview } from "./SplitPreview";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  splitting: "bg-blue-50 text-blue-600",
  ready: "bg-green-50 text-green-700",
  in_progress: "bg-brand-50 text-brand-700",
  done: "bg-slate-100 text-slate-400",
};

export function RoadmapView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<RoadmapItem | null>(null);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitPreview, setSplitPreview] = useState<{
    tasks: SplitPreviewTask[];
    epicTitle: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await roadmapApi.list(projectId));
      setError(null);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditItem(null);
    setFormOpen(true);
  }

  function openEdit(item: RoadmapItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this epic? Tasks linked to it will remain.")) return;
    try {
      await roadmapApi.delete(projectId, id);
      await load();
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleSplit(item: RoadmapItem) {
    setSplittingId(item.id);
    setError(null);
    try {
      const result = await roadmapApi.split(projectId, item.id);
      setSplitPreview({ tasks: result.tasks, epicTitle: item.title });
      await load();
    } catch (e) {
      setError(String(e));
    } finally {
      setSplittingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Roadmap"
        description="Define epics, then use AI to split them into tasks on the backlog."
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> New Epic
          </Button>
        }
      />

      {loading && <p className="text-sm text-slate-500 mb-4">Loading…</p>}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {!loading && items.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            <p className="mb-3">No epics yet. Create your first epic to get started.</p>
            <Button variant="secondary" onClick={openCreate}>
              Create epic
            </Button>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      STATUS_COLORS[item.status] ?? STATUS_COLORS.draft
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Created {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="secondary"
                  className="h-8 px-3 text-xs flex items-center gap-1"
                  onClick={() => void handleSplit(item)}
                  disabled={splittingId === item.id}
                  title="Ask AI to split this epic into tasks"
                >
                  <Scissors className="h-3.5 w-3.5" />
                  {splittingId === item.id ? "Splitting…" : "Split"}
                </Button>
                <Button
                  variant="secondary"
                  className="h-8 px-3 text-xs flex items-center gap-1"
                  onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                  title="Go to board"
                >
                  <ListTodo className="h-3.5 w-3.5" /> Board
                </Button>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="h-8 px-2.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  className="h-8 px-2.5 rounded-lg border border-red-200 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <RoadmapItemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        projectId={projectId}
        item={editItem}
        onSaved={() => void load()}
      />

      <Dialog open={!!splitPreview} onClose={() => setSplitPreview(null)} title="Split Preview" size="lg">
        {splitPreview && (
          <SplitPreview
            tasks={splitPreview.tasks}
            epicTitle={splitPreview.epicTitle}
            onConfirm={() => {
              setSplitPreview(null);
              router.push(`/dashboard/projects/${projectId}`);
            }}
            onClose={() => setSplitPreview(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
