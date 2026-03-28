"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { tasksApi } from "@/lib/api";
import type { Task } from "@/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setTasks(await tasksApi.list());
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
        title="Tasks"
        description="Create tasks and trigger workflow runs."
      />

      {loading && <p className="text-sm text-slate-500 mb-4">Loading…</p>}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load tasks: {error}
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 && !error && !loading && (
          <p className="text-slate-400 text-sm py-8 text-center">No tasks yet.</p>
        )}
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/dashboard/tasks/${task.id}`}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-brand-500/40 hover:bg-slate-50 transition-all group"
          >
            <div>
              <div className="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                {task.title}
              </div>
              {task.body && (
                <div className="text-sm text-slate-400 mt-0.5 line-clamp-1">{task.body}</div>
              )}
            </div>
            <span className="text-slate-300 group-hover:text-brand-400 text-lg">→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
