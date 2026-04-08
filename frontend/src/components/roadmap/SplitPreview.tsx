"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SplitPreviewTask } from "@/types";

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700",
  urgent: "bg-red-50 text-red-700",
};

interface SplitPreviewProps {
  tasks: SplitPreviewTask[];
  epicTitle: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function SplitPreview({ tasks, epicTitle, onConfirm, onClose }: SplitPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <span>
          AI generated <strong>{tasks.length} tasks</strong> for{" "}
          <em>&ldquo;{epicTitle}&rdquo;</em>
        </span>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {tasks.map((t, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">{t.title}</p>
              <span
                className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                  PRIORITY_COLORS[t.priority] ?? PRIORITY_COLORS.medium
                }`}
              >
                {t.priority}
              </span>
            </div>
            {t.body && <p className="text-xs text-slate-500">{t.body}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        Tasks have already been saved to the backlog. This is a confirmation view.
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onConfirm}>Go to board</Button>
      </div>
    </div>
  );
}
