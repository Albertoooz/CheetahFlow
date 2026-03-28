"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/types";

export function ProjectSettingsClient({ project }: { project: Project }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      await projectsApi.update(project.id, {
        name: name.trim() || project.name,
        description: description.trim() ? description : null,
      });
      setMsg("Saved.");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-900">Project details</h3>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
      </div>
      <Button onClick={() => void save()} disabled={busy}>
        {busy ? "Saving…" : "Save details"}
      </Button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
