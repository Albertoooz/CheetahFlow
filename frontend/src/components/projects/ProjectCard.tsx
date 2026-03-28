"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Project } from "@/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-500/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-slate-900 truncate">{project.name}</h2>
          {project.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span>{project.task_count} tasks</span>
            <span>·</span>
            <span>{project.columns?.length ?? 0} columns</span>
            <span>·</span>
            <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
      </div>
    </Link>
  );
}
