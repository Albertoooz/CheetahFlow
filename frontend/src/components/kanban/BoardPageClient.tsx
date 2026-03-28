"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ToastBar } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { agentsApi, projectsApi } from "@/lib/api";
import type { AgentConfig, Project, Task } from "@/types";
import { KanbanBoard } from "./KanbanBoard";
import { TaskDetailPanel } from "@/components/tasks/TaskDetailPanel";

const POLL_MS = 10_000;

export function BoardPageClient({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [banner, setBanner] = useState<{ tone: "error" | "success" | "info"; message: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [p, t, a] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.tasks(projectId),
        agentsApi.list(),
      ]);
      setProject(p);
      setTasks(t);
      setAgents(a);
      setNotFound(false);
      setBanner(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Refresh failed";
      if (msg.includes(" 404") || msg.includes("404:")) {
        setNotFound(true);
      } else if (msg.includes("401")) {
        setBanner({
          tone: "error",
          message:
            "Unauthorized (401). Set NEXT_PUBLIC_ADMIN_TOKEN in frontend/.env.local to match CHEETAHFLOW_ADMIN_TOKEN in backend/.env and restart pnpm dev.",
        });
      } else {
        setBanner({ tone: "error", message: msg });
      }
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refresh();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  if (loading && !project) {
    return (
      <div className="p-8 text-slate-500 text-sm">Loading board…</div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="max-w-lg mx-auto p-8 space-y-4">
        <p className="text-slate-800 font-medium">Project not found or you do not have access.</p>
        <p className="text-sm text-slate-500">
          Ensure the backend is running, <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_ADMIN_TOKEN</code> in{" "}
          <code className="bg-slate-100 px-1 rounded">frontend/.env.local</code> matches{" "}
          <code className="bg-slate-100 px-1 rounded">CHEETAHFLOW_ADMIN_TOKEN</code> in{" "}
          <code className="bg-slate-100 px-1 rounded">backend/.env</code>, then restart{" "}
          <code className="bg-slate-100 px-1 rounded">pnpm dev</code>.
        </p>
        <Link href="/dashboard/projects" className="text-brand-600 text-sm font-medium hover:underline">
          ← All projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-[100vw]">
      {banner && (
        <div className="mb-4 max-w-3xl">
          <ToastBar
            tone={banner.tone}
            message={banner.message}
            onDismiss={() => setBanner(null)}
          />
        </div>
      )}

      <PageHeader
        title={project.name}
        description={project.description ?? "Drag cards between columns. Agents can move tasks via API."}
        action={
          <div className="flex flex-wrap gap-2 justify-end">
            <Link href={`/dashboard/projects/${project.id}/settings`}>
              <Button variant="secondary" className="flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Board settings
              </Button>
            </Link>
            <Link href={`/dashboard/projects/${project.id}/tasks`}>
              <Button variant="secondary">List view</Button>
            </Link>
          </div>
        }
      />

      <KanbanBoard
        project={project}
        tasks={tasks}
        agents={agents}
        onRefresh={refresh}
        onOpenTask={(t) => {
          setSelected(t);
          setPanelOpen(true);
        }}
      />

      <TaskDetailPanel
        open={panelOpen}
        onClose={() => {
          setPanelOpen(false);
          setSelected(null);
        }}
        task={selected}
        project={project}
        onUpdated={refresh}
        onDeleted={refresh}
      />
    </div>
  );
}
