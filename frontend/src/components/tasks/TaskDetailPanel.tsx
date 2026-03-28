"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/StatusBadge";
import { Textarea } from "@/components/ui/Textarea";
import { AssigneeSelector } from "@/components/tasks/AssigneeSelector";
import { agentsApi, runsApi, tasksApi, workflowsApi } from "@/lib/api";
import type { AgentConfig, Project, Task, TaskPriority, WorkflowDefinition, WorkflowRun } from "@/types";

export function TaskDetailPanel({
  open,
  onClose,
  task,
  project,
  onUpdated,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  project: Project | null;
  onUpdated: () => Promise<void>;
  onDeleted?: () => Promise<void>;
}) {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("backlog");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [assigneeType, setAssigneeType] = useState<Task["assignee_type"]>(null);
  const [assigneeAgentId, setAssigneeAgentId] = useState<string | null>(null);
  const [assigneeHuman, setAssigneeHuman] = useState<string | null>(null);
  const [reviewerType, setReviewerType] = useState<Task["reviewer_type"]>(null);
  const [reviewerAgentId, setReviewerAgentId] = useState<string | null>(null);
  const [reviewerHuman, setReviewerHuman] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const [a, w] = await Promise.all([agentsApi.list(), workflowsApi.list()]);
      setAgents(a);
      setWorkflows(w);
    } catch {
      setAgents([]);
      setWorkflows([]);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!open || !task) return;
    setError(null);
    setTitle(task.title);
    setBody(task.body ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setWorkflowId(task.workflow_definition_id);
    setAssigneeType(task.assignee_type);
    setAssigneeAgentId(task.assignee_agent_id);
    setAssigneeHuman(task.assignee_human_name);
    setReviewerType(task.reviewer_type);
    setReviewerAgentId(task.reviewer_agent_id);
    setReviewerHuman(task.reviewer_human_name);
    void (async () => {
      try {
        setRuns(await runsApi.list(task.id));
      } catch {
        setRuns([]);
      }
    })();
  }, [open, task]);

  async function save() {
    if (!task) return;
    setSaving(true);
    setError(null);
    try {
      await tasksApi.update(task.id, {
        title: title.trim() || task.title,
        body: body.trim() ? body : null,
        status,
        priority,
        workflow_definition_id: workflowId,
        assignee_type: assigneeType,
        assignee_agent_id: assigneeAgentId,
        assignee_human_name: assigneeHuman,
        reviewer_type: reviewerType,
        reviewer_agent_id: reviewerAgentId,
        reviewer_human_name: reviewerHuman,
      });
      await onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!task) return;
    if (!window.confirm("Delete this task permanently?")) return;
    setSaving(true);
    try {
      await tasksApi.delete(task.id);
      await onDeleted?.();
      await onUpdated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  if (!task) return null;

  const columns = project?.columns?.length ? project.columns : ["backlog", "todo", "in_progress", "review", "done"];

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/30" transition />
      <div className="fixed inset-0 flex justify-end">
        <DialogPanel
          transition
          className={clsx(
            "flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl",
            "data-closed:translate-x-8 data-closed:opacity-0 duration-200",
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <DialogTitle className="text-lg font-semibold text-slate-900">Task</DialogTitle>
            <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Column</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {columns.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>
            </div>

            <AssigneeSelector
              label="Assignee"
              kind={assigneeType}
              agentId={assigneeAgentId}
              humanName={assigneeHuman}
              agents={agents}
              onKindChange={setAssigneeType}
              onAgentIdChange={setAssigneeAgentId}
              onHumanNameChange={setAssigneeHuman}
            />

            <AssigneeSelector
              label="Reviewer (human or agent)"
              kind={reviewerType}
              agentId={reviewerAgentId}
              humanName={reviewerHuman}
              agents={agents}
              onKindChange={setReviewerType}
              onAgentIdChange={setReviewerAgentId}
              onHumanNameChange={setReviewerHuman}
            />

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Workflow</label>
              <Select
                value={workflowId ?? ""}
                onChange={(e) => setWorkflowId(e.target.value || null)}
              >
                <option value="">None</option>
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="text-xs text-slate-400">
              Created {new Date(task.created_at).toLocaleString()} · Updated{" "}
              {new Date(task.updated_at).toLocaleString()}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Runs</h3>
              {runs.length === 0 ? (
                <p className="text-sm text-slate-400">No runs yet.</p>
              ) : (
                <div className="space-y-2">
                  {runs.map((run) => (
                    <div key={run.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={run.status} />
                        <span className="text-xs text-slate-400">{run.id.slice(0, 8)}…</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
            <Button variant="danger" className="flex items-center gap-2" onClick={() => void remove()} disabled={saving}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => void save()} disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
