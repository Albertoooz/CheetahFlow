import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Task, tasksApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  let tasks: Task[] = [];
  let error: string | null = null;

  try {
    tasks = await tasksApi.list();
  } catch (e) {
    error = String(e);
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Create tasks and trigger workflow runs."
      />

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load tasks: {error}
        </div>
      )}

      <div className="space-y-3">
        {tasks.length === 0 && !error && (
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
