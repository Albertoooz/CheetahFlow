const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Token": ADMIN_TOKEN,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Agents ──────────────────────────────────────────────────────────────────
export const agentsApi = {
  list: () => req<AgentConfig[]>("/api/v1/agents"),
  create: (body: Partial<AgentConfig>) =>
    req<AgentConfig>("/api/v1/agents", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<AgentConfig>) =>
    req<AgentConfig>(`/api/v1/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => req<void>(`/api/v1/agents/${id}`, { method: "DELETE" }),
};

// ── Workflows ────────────────────────────────────────────────────────────────
export const workflowsApi = {
  list: () => req<WorkflowDefinition[]>("/api/v1/workflows"),
  create: (body: Partial<WorkflowDefinition>) =>
    req<WorkflowDefinition>("/api/v1/workflows", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<WorkflowDefinition>) =>
    req<WorkflowDefinition>(`/api/v1/workflows/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => req<void>(`/api/v1/workflows/${id}`, { method: "DELETE" }),
};

// ── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: () => req<Task[]>("/api/v1/tasks"),
  create: (body: Partial<Task>) =>
    req<Task>("/api/v1/tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Task>) =>
    req<Task>(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => req<void>(`/api/v1/tasks/${id}`, { method: "DELETE" }),
};

// ── Runs ─────────────────────────────────────────────────────────────────────
export const runsApi = {
  list: (taskId: string) => req<WorkflowRun[]>(`/api/v1/tasks/${taskId}/runs`),
  trigger: (taskId: string, body?: { workflow_definition_id?: string }) =>
    req<WorkflowRun>(`/api/v1/tasks/${taskId}/runs`, { method: "POST", body: JSON.stringify(body ?? {}) }),
  get: (taskId: string, runId: string) => req<WorkflowRun>(`/api/v1/tasks/${taskId}/runs/${runId}`),
  resume: (taskId: string, runId: string, approved = true) =>
    req<WorkflowRun>(`/api/v1/tasks/${taskId}/runs/${runId}/resume`, {
      method: "POST",
      body: JSON.stringify({ approved }),
    }),
};

// ── Types (mirror backend schemas) ───────────────────────────────────────────
export interface AgentConfig {
  id: string;
  workspace_id: string;
  role_key: string;
  display_name: string;
  model_provider: string;
  model_name: string;
  enabled: boolean;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  type: "agent" | "human_gate";
  role_key?: string;
  label?: string;
  executor?: "openrouter" | "claude_code";
}

export interface WorkflowDefinition {
  id: string;
  workspace_id: string;
  name: string;
  is_default: boolean;
  stages: Stage[];
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  body: string | null;
  workflow_definition_id: string | null;
  stage_overrides: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: string;
  run_id: string;
  stage_index: number;
  stage_id: string;
  role_key: string | null;
  executor: string | null;
  status: string;
  input_summary: string | null;
  output_summary: string | null;
  token_usage: Record<string, number> | null;
  error_message: string | null;
  langfuse_trace_id: string | null;
  langfuse_observation_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  task_id: string;
  workflow_definition_id: string;
  status: string;
  current_stage_index: number;
  langgraph_thread_id: string | null;
  langfuse_trace_id: string | null;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}
