"use client";

import { Draggable } from "@hello-pangea/dnd";
import { GripVertical, Trash2, UserCheck, Bot } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import type { AgentConfig, Stage } from "@/types";

interface StepCardProps {
  step: Stage;
  index: number;
  agents: AgentConfig[];
  onChange: (updated: Stage) => void;
  onRemove: () => void;
}

export function StepCard({ step, index, agents, onChange, onRemove }: StepCardProps) {
  const isGate = step.type === "human_gate";

  return (
    <Draggable draggableId={step.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition-shadow ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-brand-400" : "border-slate-200"
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="mt-1 cursor-grab text-slate-400 hover:text-slate-600"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              {isGate ? (
                <UserCheck className="h-4 w-4 text-yellow-500 shrink-0" />
              ) : (
                <Bot className="h-4 w-4 text-brand-500 shrink-0" />
              )}
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isGate ? "Human Gate" : "Agent Step"}
              </span>
              <span className="ml-auto text-xs text-slate-300">#{index + 1}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
              <Input
                value={step.label ?? ""}
                onChange={(e) => onChange({ ...step, label: e.target.value })}
                placeholder={isGate ? "e.g. Code Review" : "e.g. Planning"}
              />
            </div>

            {!isGate && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Agent</label>
                  <Select
                    value={step.role_key ?? ""}
                    onChange={(e) => onChange({ ...step, role_key: e.target.value || undefined })}
                  >
                    <option value="">None / any</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.role_key}>
                        {a.display_name} ({a.role_key})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Executor</label>
                  <Select
                    value={step.executor ?? "openrouter"}
                    onChange={(e) =>
                      onChange({ ...step, executor: e.target.value as Stage["executor"] })
                    }
                  >
                    <option value="openrouter">OpenRouter (LLM)</option>
                    <option value="claude_code">Claude Code (CLI)</option>
                  </Select>
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onRemove}
            className="mt-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </Draggable>
  );
}
