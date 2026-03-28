import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard/agents", label: "Agents" },
  { href: "/dashboard/workflows", label: "Workflows" },
  { href: "/dashboard/tasks", label: "Tasks" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <Link href="/" className="text-lg font-bold text-white hover:text-brand-400 transition-colors">
            AgentFlow
          </Link>
          <div className="text-xs text-slate-500 mt-0.5">Orchestrator</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all text-sm"
            >
              {item.label}
            </Link>
          ))}
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

      {/* Main */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
