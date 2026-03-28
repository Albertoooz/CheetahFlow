"use client";

import { Droppable } from "@hello-pangea/dnd";
import clsx from "clsx";
import { MoreHorizontal } from "lucide-react";
import type { AgentConfig, Task } from "@/types";
import { Dropdown } from "@/components/ui/Dropdown";
import { AddTaskInline } from "./AddTaskInline";
import { TaskCard } from "./TaskCard";

function labelize(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function KanbanColumn({
  columnId,
  tasks,
  agents,
  projectId,
  onOpenTask,
  onTaskCreated,
  onRenameColumn,
  onDeleteColumn,
}: {
  columnId: string;
  tasks: Task[];
  agents: AgentConfig[];
  projectId: string;
  onOpenTask: (t: Task) => void;
  onTaskCreated: () => void;
  onRenameColumn?: (oldKey: string, newKey: string) => void;
  onDeleteColumn?: (key: string) => void;
}) {
  const sorted = [...tasks].sort((a, b) => a.position - b.position || a.title.localeCompare(b.title));

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl bg-slate-100/80 border border-slate-200/80 max-h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-200/70">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{labelize(columnId)}</h3>
          <p className="text-[11px] text-slate-500 font-mono truncate">{columnId}</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-500 tabular-nums">{sorted.length}</span>
          {(onRenameColumn || onDeleteColumn) && (
            <Dropdown
              label={<MoreHorizontal className="h-4 w-4" />}
              items={[
                ...(onRenameColumn
                  ? [
                      {
                        key: "rename",
                        label: "Rename…",
                        onClick: () => {
                          const next = window.prompt("New column key (slug)", columnId);
                          if (next && next !== columnId) onRenameColumn(columnId, next.trim());
                        },
                      },
                    ]
                  : []),
                ...(onDeleteColumn
                  ? [
                      {
                        key: "del",
                        label: "Delete column",
                        danger: true,
                        onClick: () => {
                          if (window.confirm(`Delete column ${columnId}? Tasks will move out if needed.`)) {
                            onDeleteColumn(columnId);
                          }
                        },
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </div>
      </div>

      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={clsx(
              "flex-1 overflow-y-auto px-2 pt-2 pb-1 min-h-[120px]",
              snapshot.isDraggingOver && "bg-brand-500/5",
            )}
          >
            {sorted.map((task, idx) => (
              <TaskCard key={task.id} task={task} index={idx} agents={agents} onOpen={onOpenTask} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="p-2 border-t border-slate-200/70 bg-slate-50/80 rounded-b-2xl">
        <AddTaskInline projectId={projectId} status={columnId} onCreated={onTaskCreated} />
      </div>
    </div>
  );
}
