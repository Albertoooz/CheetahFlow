"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { tasksApi } from "@/lib/api";

export function AddTaskInline({
  projectId,
  status,
  onCreated,
}: {
  projectId: string;
  status: string;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await tasksApi.create({
        title: title.trim(),
        project_id: projectId,
        status,
        position: Date.now(),
      });
      setTitle("");
      setOpen(false);
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" className="w-full text-slate-500 text-xs" onClick={() => setOpen(true)}>
        + Add task
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Input
        autoFocus
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-sm"
      />
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={busy}>
          Add
        </Button>
      </div>
    </form>
  );
}
