import { PageHeader } from "@/components/PageHeader";
import { AgentConfig, agentsApi } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  let agents: AgentConfig[] = [];
  let error: string | null = null;

  try {
    agents = await agentsApi.list();
  } catch (e) {
    error = String(e);
  }

  return (
    <div>
      <PageHeader
        title="Agent Roster"
        description="Configure roles, models and instructions for each agent."
      />

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Failed to load agents: {error}
        </div>
      )}

      <div className="space-y-3">
        {agents.length === 0 && !error && (
          <p className="text-slate-400 text-sm py-8 text-center">
            No agents configured yet. Create one via the API or{" "}
            <a href="http://127.0.0.1:8000/docs" className="text-brand-500 hover:underline">
              API docs
            </a>
            .
          </p>
        )}
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{agent.display_name}</span>
                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                  {agent.role_key}
                </span>
                {!agent.enabled && (
                  <span className="text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded">disabled</span>
                )}
              </div>
              <div className="text-sm text-slate-500">
                {agent.model_provider} / {agent.model_name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
