"use client";

import type { DropResult } from "@hello-pangea/dnd";
import { DragDropContext } from "@hello-pangea/dnd";
import { useCallback, useMemo } from "react";
import { tasksApi } from "@/lib/api";
import type { AgentConfig, Project, Task } from "@/types";
import { KanbanColumn } from "./KanbanColumn";

export function KanbanBoard({
  project,
  tasks,
  agents,
  onRefresh,
  onOpenTask,
}: {
  project: Project;
  tasks: Task[];
  agents: AgentConfig[];
  onRefresh: () => Promise<void>;
  onOpenTask: (t: Task) => void;
}) {
  const columns = project.columns?.length ? project.columns : ["backlog", "todo", "in_progress", "review", "done"];

  const grouped = useMemo(() => {
    const g: Record<string, Task[]> = {};
    for (const c of columns) g[c] = [];
    for (const t of tasks) {
      const col = t.status && g[t.status] !== undefined ? t.status : columns[0];
      if (!g[col]) g[col] = [];
      g[col].push(t);
    }
    return g;
  }, [tasks, columns]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const newStatus = destination.droppableId;
      const position = destination.index * 1000;

      try {
        await tasksApi.move(draggableId, { status: newStatus, position });
        await onRefresh();
      } catch (e) {
        console.error(e);
        alert(e instanceof Error ? e.message : "Move failed");
        await onRefresh();
      }
    },
    [onRefresh],
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 px-1 pt-1">
        {columns.map((col) => (
          <KanbanColumn
            key={col}
            columnId={col}
            tasks={grouped[col] ?? []}
            agents={agents}
            projectId={project.id}
            onOpenTask={onOpenTask}
            onTaskCreated={onRefresh}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
