"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/types";
import { ProjectCard } from "./ProjectCard";
import { ProjectForm } from "./ProjectForm";

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setProjects(await projectsApi.list());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Projects"
        description="Each project has its own board, columns, and tasks."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New project
            </Button>
          </div>
        }
      />

      {loading && <p className="text-sm text-slate-500 mb-4">Loading projects…</p>}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <div key={p.id} className="relative group">
            <ProjectCard project={p} />
            <button
              type="button"
              className="absolute top-3 right-10 text-xs text-slate-400 hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                setEditing(p);
                setFormOpen(true);
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {projects.length === 0 && !error && !loading && (
        <p className="text-slate-400 text-sm py-12 text-center">No projects yet. Create one to open a board.</p>
      )}

      <ProjectForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        project={editing}
        onSaved={refresh}
      />
    </div>
  );
}
