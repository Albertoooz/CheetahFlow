"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { projectsApi } from "@/lib/api";
import type { Project } from "@/types";

const DEFAULT_COLS = ["backlog", "todo", "in_progress", "review", "done"];

export function ProjectForm({
  open,
  onClose,
  project,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
    } else {
      setName("");
      setDescription("");
    }
  }, [open, project]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (project) {
        await projectsApi.update(project.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
      } else {
        await projectsApi.create({
          name: name.trim(),
          description: description.trim() || null,
          columns: [...DEFAULT_COLS],
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={project ? "Edit project" : "New project"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[80px]" />
        </div>
        {!project && (
          <p className="text-xs text-slate-500">
            Default columns: {DEFAULT_COLS.join(", ")}. You can change them in board settings.
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
