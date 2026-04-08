"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { roadmapApi } from "@/lib/api";
import type { RoadmapItem } from "@/types";

export function RoadmapItemForm({
  open,
  onClose,
  projectId,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  item: RoadmapItem | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? "");
    } else {
      setTitle("");
      setDescription("");
    }
  }, [open, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (item) {
        await roadmapApi.update(projectId, item.id, {
          title: title.trim(),
          description: description.trim() || null,
        });
      } else {
        await roadmapApi.create(projectId, {
          title: title.trim(),
          description: description.trim() || null,
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
    <Dialog open={open} onClose={onClose} title={item ? "Edit epic" : "New epic"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. User Authentication"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Description (markdown supported)
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the feature in detail. The AI will use this to generate tasks."
            rows={8}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : item ? "Save" : "Create epic"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
