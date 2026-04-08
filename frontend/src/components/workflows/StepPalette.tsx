"use client";

import { Bot, UserCheck } from "lucide-react";
import type { Stage } from "@/types";

interface StepPaletteProps {
  onAddStep: (step: Stage) => void;
}

const PALETTE_ITEMS: { type: Stage["type"]; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: "agent",
    label: "Agent Step",
    icon: <Bot className="h-5 w-5 text-brand-500" />,
    description: "Assign an AI agent to perform work",
  },
  {
    type: "human_gate",
    label: "Human Gate",
    icon: <UserCheck className="h-5 w-5 text-yellow-500" />,
    description: "Pause for human approval before continuing",
  },
];

function makeStepId() {
  return `step_${Math.random().toString(36).slice(2, 9)}`;
}

export function StepPalette({ onAddStep }: StepPaletteProps) {
  return (
    <div className="w-56 shrink-0 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 px-1">Add step</p>
      {PALETTE_ITEMS.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() =>
            onAddStep({
              id: makeStepId(),
              type: item.type,
              label: item.label,
              executor: item.type === "agent" ? "openrouter" : undefined,
            })
          }
          className="w-full flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm hover:border-brand-400 hover:shadow-md transition-all"
        >
          <span className="mt-0.5 shrink-0">{item.icon}</span>
          <span>
            <span className="block text-sm font-medium text-slate-800">{item.label}</span>
            <span className="block text-xs text-slate-500 mt-0.5">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
