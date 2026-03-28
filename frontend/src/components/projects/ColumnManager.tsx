"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { projectsApi, tasksApi } from "@/lib/api";
import type { Project, Task } from "@/types";

function multisetEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

export function ColumnManager({
  project,
  tasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const router = useRouter();
  const initial = useMemo(() => project.columns ?? [], [project.columns]);
  const [cols, setCols] = useState<string[]>(() => [...initial]);

  useEffect(() => {
    setCols([...initial]);
  }, [initial]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= cols.length) return;
    setCols((c) => {
      const n = [...c];
      [n[idx], n[j]] = [n[j], n[idx]];
      return n;
    });
  }

  async function save() {
    const next = cols.map((c) => c.trim()).filter(Boolean);
    const uniq = new Set(next);
    if (uniq.size !== next.length) {
      setMessage("Column keys must be unique.");
      return;
    }
    if (next.length === 0) {
      setMessage("Need at least one column.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const prev = project.columns ?? [];

    try {
      if (multisetEqual(prev, next)) {
        await projectsApi.update(project.id, { columns: next });
        setMessage("Board columns updated.");
        router.refresh();
        setBusy(false);
        return;
      }

      const removed = prev.filter((k) => !next.includes(k));
      const added = next.filter((k) => !prev.includes(k));
      if (removed.length === 1 && added.length === 1) {
        const [r] = removed;
        const [a] = added;
        const toUpdate = tasks.filter((t) => t.status === r);
        for (const t of toUpdate) {
          await tasksApi.update(t.id, { status: a });
        }
        await projectsApi.update(project.id, { columns: next });
        setMessage(`Renamed column ${r} → ${a} and migrated ${toUpdate.length} tasks.`);
        router.refresh();
        setBusy(false);
        return;
      }

      await projectsApi.update(project.id, { columns: next });
      const fallback = next[0];
      let migrated = 0;
      for (const t of tasks) {
        if (!next.includes(t.status)) {
          await tasksApi.update(t.id, { status: fallback });
          migrated += 1;
        }
      }
      setMessage(`Saved columns. Moved ${migrated} tasks to ${fallback}.`);
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-900">Board columns</h3>
      <p className="text-sm text-slate-500">
        Keys are stored on tasks as <code className="text-xs bg-slate-100 px-1 rounded">status</code>. Reordering only
        changes the board layout. Renaming one key to a new key migrates matching tasks automatically when exactly one
        name is removed and one is added.
      </p>

      <div className="space-y-2">
        {cols.map((c, i) => (
          <div key={`${i}-${c}`} className="flex gap-2 items-center">
            <Input value={c} onChange={(e) => setCols((x) => x.map((v, j) => (j === i ? e.target.value : v)))} />
            <Button type="button" variant="secondary" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>
              ↑
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => move(i, 1)}
              disabled={i === cols.length - 1}
            >
              ↓
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setCols((x) => {
                  if (x.length <= 1) return x;
                  return x.filter((_, j) => j !== i);
                })
              }
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => setCols((x) => [...x, `column_${x.length + 1}`])}>
          Add column
        </Button>
        <Button type="button" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Save columns"}
        </Button>
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
