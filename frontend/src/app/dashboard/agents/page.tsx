import { AgentList } from "@/components/agents/AgentList";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default function AgentsPage() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <PageHeader
        title="Agent roster"
        description="Configure roles, models, integrations, and instructions (OpenClaw-style)."
      />
      <AgentList />
    </div>
  );
}
