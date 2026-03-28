"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { projectsApi } from "@/lib/api";
import type { Project, Task } from "@/types";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

export function ProjectTasksClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([projectsApi.get(projectId), projectsApi.tasks(projectId)]);
      setProject(p);
      setTasks(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return <p className="text-sm text-slate-500 py-8">Loading tasks…</p>;
  }

  if (error || !project) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error ?? "Could not load project."}
      </div>
    );
  }

  return (
    <>
      <PageHeader title={`${project.name} — tasks`} description="All tasks in this project." />

      <div className="space-y-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelected(t);
              setOpen(true);
            }}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:border-brand-500/30"
          >
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{t.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t.status.replace(/_/g, " ")}</div>
            </div>
            <Badge tone="neutral">{t.priority}</Badge>
          </button>
        ))}
      </div>

      <TaskDetailPanel
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
        }}
        task={selected}
        project={project}
        onUpdated={refresh}
        onDeleted={refresh}
      />
    </>
  );
}
