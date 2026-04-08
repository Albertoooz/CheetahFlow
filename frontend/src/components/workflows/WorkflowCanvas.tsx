"use client";

import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ArrowRight } from "lucide-react";
import { StepCard } from "./StepCard";
import { StepPalette } from "./StepPalette";
import type { AgentConfig, Stage } from "@/types";

interface WorkflowCanvasProps {
  stages: Stage[];
  agents: AgentConfig[];
  onChange: (stages: Stage[]) => void;
}

export function WorkflowCanvas({ stages, agents, onChange }: WorkflowCanvasProps) {
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;
    const items = Array.from(stages);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onChange(items);
  }

  function updateStep(index: number, updated: Stage) {
    const next = stages.map((s, i) => (i === index ? updated : s));
    onChange(next);
  }

  function removeStep(index: number) {
    onChange(stages.filter((_, i) => i !== index));
  }

  function addStep(step: Stage) {
    onChange([...stages, step]);
  }

  return (
    <div className="flex gap-6 items-start">
      <div className="flex-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="workflow-stages">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3 min-h-[120px]"
              >
                {stages.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                    Add steps from the palette on the right →
                  </div>
                )}
                {stages.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-2">
                    <div className="flex-1">
                      <StepCard
                        step={step}
                        index={i}
                        agents={agents}
                        onChange={(updated) => updateStep(i, updated)}
                        onRemove={() => removeStep(i)}
                      />
                    </div>
                    {i < stages.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <StepPalette onAddStep={addStep} />
    </div>
  );
}
