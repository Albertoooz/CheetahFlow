"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ColumnManager } from "@/components/projects/ColumnManager";
import { PageHeader } from "@/components/PageHeader";
import { ProjectSettingsClient } from "@/components/projects/ProjectSettingsClient";
import { projectsApi } from "@/lib/api";
import type { Project, Task } from "@/types";

export function ProjectSettingsShell({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([projectsApi.get(projectId), projectsApi.tasks(projectId)]);
      setProject(p);
      setTasks(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load project");
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <div className="max-w-3xl mx-auto p-8 text-slate-500 text-sm">Loading…</div>;
  }

  if (error || !project) {
    return (
      <div className="max-w-3xl mx-auto p-8 space-y-3">
        <p className="text-red-700 text-sm">{error ?? "Project not found."}</p>
        <p className="text-xs text-slate-500">
          Check <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_ADMIN_TOKEN</code> matches the backend token.
        </p>
        <Link href="/dashboard/projects" className="text-brand-600 text-sm hover:underline">
          ← Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
      <Link href={`/dashboard/projects/${projectId}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Back to board
      </Link>
      <PageHeader title="Board settings" description={project.name} />

      <ProjectSettingsClient project={project} />

      <ColumnManager project={project} tasks={tasks} />
    </div>
  );
}
