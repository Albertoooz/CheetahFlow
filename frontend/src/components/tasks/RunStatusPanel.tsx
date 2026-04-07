"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle, XCircle, Clock, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { runsApi } from "@/lib/api";
import type { WorkflowRun, WorkflowStep } from "@/types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-slate-400" />,
  running: <Loader2 className="h-4 w-4 text-brand-500 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  failed: <XCircle className="h-4 w-4 text-red-500" />,
  skipped: <Clock className="h-4 w-4 text-slate-300" />,
};

const RUN_STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600",
  running: "bg-brand-50 text-brand-700",
  paused: "bg-yellow-50 text-yellow-700",
  completed: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function StepRow({ step }: { step: WorkflowStep }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
      <span className="mt-0.5 shrink-0">{STATUS_ICONS[step.status] ?? STATUS_ICONS.pending}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {step.stage_id || `Step ${step.stage_index + 1}`}
        </p>
        {step.output_summary && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.output_summary}</p>
        )}
        {step.error_message && (
          <p className="text-xs text-red-600 mt-0.5">{step.error_message}</p>
        )}
        {step.token_usage && step.token_usage.total_tokens > 0 && (
          <p className="text-xs text-slate-400 mt-0.5">
            {step.token_usage.total_tokens} tokens
          </p>
        )}
      </div>
      <span
        className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
          RUN_STATUS_COLORS[step.status] ?? RUN_STATUS_COLORS.pending
        }`}
      >
        {step.status}
      </span>
    </div>
  );
}

interface RunStatusPanelProps {
  taskId: string;
  runId: string;
  initialRun: WorkflowRun;
  onResume: (approved: boolean) => Promise<void>;
}

export function RunStatusPanel({ taskId, runId, initialRun, onResume }: RunStatusPanelProps) {
  const [run, setRun] = useState<WorkflowRun>(initialRun);
  const [resuming, setResuming] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const isTerminal = ["completed", "failed", "cancelled"].includes(run.status);

  useEffect(() => {
    if (isTerminal) return;

    const es = runsApi.stream(taskId, runId);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WorkflowRun;
        setRun(data);
      } catch {
        // ignore malformed event
      }
    };

    es.addEventListener("done", () => {
      es.close();
    });

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
  }, [taskId, runId, isTerminal]);

  async function handleResume(approved: boolean) {
    setResuming(true);
    try {
      await onResume(approved);
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Run #{runId.slice(0, 8)}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            RUN_STATUS_COLORS[run.status] ?? RUN_STATUS_COLORS.pending
          }`}
        >
          {run.status}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {run.steps.length === 0 && (
          <p className="text-xs text-slate-400 py-2">No steps yet…</p>
        )}
        {run.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </div>

      {run.status === "paused" && (
        <div className="flex items-center gap-2 pt-1">
          <UserCheck className="h-4 w-4 text-yellow-500 shrink-0" />
          <span className="text-xs text-slate-600 flex-1">Waiting for human approval</span>
          <Button
            variant="primary"
            className="h-7 px-3 text-xs"
            onClick={() => void handleResume(true)}
            disabled={resuming}
          >
            Approve
          </Button>
          <Button
            variant="danger"
            className="h-7 px-3 text-xs"
            onClick={() => void handleResume(false)}
            disabled={resuming}
          >
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
