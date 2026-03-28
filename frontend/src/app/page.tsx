import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 border border-brand-500/30 rounded-full px-4 py-1.5 text-brand-500 text-sm font-medium">
            MVP — Phase A
          </div>
          <h1 className="text-5xl font-bold tracking-tight">
            AgentFlow <span className="text-brand-500">Orchestrator</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            Self-hosted control plane for multi-agent development workflows. State, handoffs, and audit before merge.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { href: "/dashboard/agents", label: "Agents", desc: "Manage agent roles & models" },
            { href: "/dashboard/workflows", label: "Workflows", desc: "Define ordered stage pipelines" },
            { href: "/dashboard/tasks", label: "Tasks", desc: "Create tasks and trigger runs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-5 rounded-xl bg-slate-800 border border-slate-700 hover:border-brand-500/50 hover:bg-slate-700 transition-all group"
            >
              <div className="font-semibold text-white group-hover:text-brand-400 transition-colors">
                {item.label}
              </div>
              <div className="text-sm text-slate-400 mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>

        <p className="text-slate-500 text-sm">
          API docs at{" "}
          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-brand-400 hover:underline"
          >
            localhost:8000/docs
          </a>
        </p>
      </div>
    </main>
  );
}
