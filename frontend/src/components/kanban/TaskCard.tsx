"use client";

import { Draggable } from "@hello-pangea/dnd";
import clsx from "clsx";
import { GripVertical } from "lucide-react";
import type { AgentConfig, Task } from "@/types";

const PRIORITY_BORDER: Record<string, string> = {
  low: "border-l-slate-300",
  medium: "border-l-brand-400",
  high: "border-l-amber-500",
  urgent: "border-l-red-500",
};

function initials(task: Task, agents: AgentConfig[]) {
  if (task.assignee_type === "human" && task.assignee_human_name) {
    const p = task.assignee_human_name.trim().split(/\s+/);
    return (p[0]?.[0] ?? "?").toUpperCase() + (p[1]?.[0] ?? "").toUpperCase();
  }
  if (task.assignee_type === "agent" && task.assignee_agent_id) {
    const a = agents.find((x) => x.id === task.assignee_agent_id);
    return a?.display_name?.slice(0, 2).toUpperCase() ?? "A";
  }
  return "—";
}

export function TaskCard({
  task,
  index,
  agents,
  onOpen,
}: {
  task: Task;
  index: number;
  agents: AgentConfig[];
  onOpen: (t: Task) => void;
}) {
  const border = PRIORITY_BORDER[task.priority] ?? PRIORITY_BORDER.medium;
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={clsx(
            "mb-2 flex gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2 shadow-sm border-l-4 w-full",
            border,
            snapshot.isDragging && "ring-2 ring-brand-500/30 shadow-lg",
          )}
        >
          <button
            type="button"
            className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0"
            {...provided.dragHandleProps}
            aria-label="Drag task"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpen(task)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="font-medium text-slate-900 text-sm line-clamp-2">{task.title}</div>
            <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                {initials(task, agents)}
              </span>
              <div className="flex flex-wrap gap-1 justify-end">
                {task.reviewer_type && (
                  <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800">Review</span>
                )}
              </div>
            </div>
          </button>
        </div>
      )}
    </Draggable>
  );
}
