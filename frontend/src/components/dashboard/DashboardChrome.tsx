"use client";

import clsx from "clsx";
import { ChevronDown, FolderKanban, LayoutGrid, ListTodo, Settings2, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/types";

function projectIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/dashboard\/projects\/([^/]+)/);
  if (!m) return null;
  if (["new"].includes(m[1])) return null;
  return m[1];
}

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const projectId = projectIdFromPath(pathname || "");
  const [projects, setProjects] = useState<Project[]>([]);

  const loadProjects = useCallback(async () => {
    try {
      setProjects(await projectsApi.list());
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const currentProject = projectId ? projects.find((p) => p.id === projectId) : null;

  const navClass = (active: boolean) =>
    clsx(
      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
      active ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white hover:bg-slate-800/80",
    );

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 md:w-64 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-700">
          <Link href="/" className="text-lg font-bold text-white hover:text-brand-400 transition-colors block">
            CheetahFlow
          </Link>
          <div className="text-xs text-slate-500 mt-0.5">Orchestrator</div>
        </div>

        <div className="p-3 border-b border-slate-700">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1 mb-2">
            Project
          </div>
          <Menu as="div" className="relative">
            <MenuButton className="flex w-full items-center justify-between gap-2 rounded-lg bg-slate-800 px-3 py-2 text-left text-sm text-white hover:bg-slate-700 border border-slate-600">
              <span className="truncate">{currentProject?.name ?? "Select project…"}</span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
            </MenuButton>
            <MenuItems className="absolute left-0 right-0 z-40 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-600 bg-slate-800 py-1 shadow-xl outline-none">
              <MenuItem>
                {({ focus }) => (
                  <Link
                    href="/dashboard/projects"
                    className={clsx(
                      "block px-3 py-2 text-sm text-slate-200",
                      focus && "bg-slate-700",
                    )}
                  >
                    All projects…
                  </Link>
                )}
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id}>
                  {({ focus }) => (
                    <Link
                      href={`/dashboard/projects/${p.id}`}
                      className={clsx(
                        "block truncate px-3 py-2 text-sm text-slate-200",
                        focus && "bg-slate-700",
                      )}
                    >
                      {p.name}
                    </Link>
                  )}
                </MenuItem>
              ))}
            </MenuItems>
          </Menu>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <Link href="/dashboard/projects" className={navClass(pathname === "/dashboard/projects")}>
            <FolderKanban className="h-4 w-4 shrink-0" />
            Projects
          </Link>
          <Link href="/dashboard/agents" className={navClass(pathname?.startsWith("/dashboard/agents") ?? false)}>
            <Users className="h-4 w-4 shrink-0" />
            Agents
          </Link>

          {projectId && (
            <>
              <div className="pt-3 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-semibold px-1">
                Current
              </div>
              <Link
                href={`/dashboard/projects/${projectId}`}
                className={navClass(pathname === `/dashboard/projects/${projectId}`)}
              >
                <LayoutGrid className="h-4 w-4 shrink-0" />
                Board
              </Link>
              <Link
                href={`/dashboard/projects/${projectId}/tasks`}
                className={navClass(pathname === `/dashboard/projects/${projectId}/tasks`)}
              >
                <ListTodo className="h-4 w-4 shrink-0" />
                Tasks
              </Link>
              <Link href="/dashboard/workflows" className={navClass(pathname?.startsWith("/dashboard/workflows") ?? false)}>
                <Settings2 className="h-4 w-4 shrink-0" />
                Workflows
              </Link>
              <Link
                href={`/dashboard/projects/${projectId}/settings`}
                className={navClass(pathname === `/dashboard/projects/${projectId}/settings`)}
              >
                <Settings2 className="h-4 w-4 shrink-0" />
                Board settings
              </Link>
            </>
          )}

          {!projectId && (
            <Link
              href="/dashboard/workflows"
              className={navClass(pathname?.startsWith("/dashboard/workflows") ?? false)}
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              Workflows
            </Link>
          )}
          {!projectId && (
            <Link href="/dashboard/tasks" className={navClass(pathname?.startsWith("/dashboard/tasks") ?? false)}>
              <ListTodo className="h-4 w-4 shrink-0" />
              All tasks
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            API Docs →
          </a>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-slate-50 min-h-screen">{children}</main>
    </div>
  );
}
