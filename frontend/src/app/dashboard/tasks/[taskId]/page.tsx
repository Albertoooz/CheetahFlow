import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { runsApi, tasksApi, WorkflowRun } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const { taskId } = params;

  let task;
  try {
    task = await tasksApi.list().then((tasks) => tasks.find((t) => t.id === taskId));
  } catch {
    task = undefined;
  }

  if (!task) notFound();

  let runs: WorkflowRun[] = [];
  try {
    runs = await runsApi.list(taskId);
  } catch {
    runs = [];
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/tasks" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Tasks
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">{task.title}</h1>
        {task.body && <p className="text-slate-500 mt-1">{task.body}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Runs</h2>
          {task.workflow_definition_id && (
            <span className="text-xs text-slate-400">
              Trigger via{" "}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                POST /api/v1/tasks/{taskId}/runs
              </code>
            </span>
          )}
        </div>

        {runs.length === 0 ? (
          <p className="text-slate-400 text-sm py-6 text-center">No runs yet.</p>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <div key={run.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={run.status} />
                    <span className="text-xs font-mono text-slate-400">{run.id.slice(0, 8)}…</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(run.created_at).toLocaleString()}
                  </span>
                </div>

                {run.steps.length > 0 && (
                  <div className="divide-y divide-slate-50">
                    {run.steps.map((step) => (
                      <div key={step.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                            {step.stage_index + 1}
                          </span>
                          <span className="text-slate-700">{step.stage_id}</span>
                          {step.executor && (
                            <span className="text-xs text-slate-400">({step.executor})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {step.token_usage?.total_tokens != null && (
                            <span className="text-xs text-slate-400">
                              {step.token_usage.total_tokens} tokens
                            </span>
                          )}
                          <StatusBadge status={step.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
