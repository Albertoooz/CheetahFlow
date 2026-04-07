import type {
  AgentConfig,
  Project,
  RoadmapItem,
  Task,
  WorkflowDefinition,
  WorkflowRun,
} from "@/types";

export type {
  AgentConfig,
  AssigneeKind,
  Project,
  RoadmapItem,
  SplitPreviewTask,
  Stage,
  Task,
  TaskPriority,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStep,
} from "@/types";

/** Server (RSC / Node): call backend directly. Browser: empty string = same-origin → Next.js rewrites → backend (no CORS). */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.INTERNAL_API_URL ??
    "http://127.0.0.1:8000"
  );
}

const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_TOKEN ?? "";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development" && !ADMIN_TOKEN) {
  // eslint-disable-next-line no-console
  console.warn(
    "[CheetahFlow] NEXT_PUBLIC_ADMIN_TOKEN is empty. Create frontend/.env.local with NEXT_PUBLIC_ADMIN_TOKEN matching CHEETAHFLOW_ADMIN_TOKEN in backend/.env",
  );
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  if (path.startsWith("http")) return path;
  if (!base) return path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = buildUrl(path);
  const res = await fetch(url, {
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
  create: (body: Partial<AgentConfig> & { role_key?: string; display_name?: string }) =>
    req<AgentConfig>("/api/v1/agents", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<AgentConfig>) =>
    req<AgentConfig>(`/api/v1/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => req<void>(`/api/v1/agents/${id}`, { method: "DELETE" }),
};

// ── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => req<Project[]>("/api/v1/projects"),
  get: (id: string) => req<Project>(`/api/v1/projects/${id}`),
  create: (body: { name: string; description?: string | null; columns?: string[] }) =>
    req<Project>("/api/v1/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<{ name: string; description: string | null; columns: string[] }>) =>
    req<Project>(`/api/v1/projects/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) => req<void>(`/api/v1/projects/${id}`, { method: "DELETE" }),
  tasks: (id: string) => req<Task[]>(`/api/v1/projects/${id}/tasks`),
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
  create: (body: Partial<Task>) => req<Task>("/api/v1/tasks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Partial<Task>) =>
    req<Task>(`/api/v1/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  move: (id: string, body: { status: string; position: number }) =>
    req<Task>(`/api/v1/tasks/${id}/move`, { method: "PATCH", body: JSON.stringify(body) }),
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
  /** Returns an EventSource that streams run status updates. Close it when done. */
  stream: (taskId: string, runId: string): EventSource =>
    new EventSource(buildUrl(`/api/v1/tasks/${taskId}/runs/${runId}/stream`)),
};

// ── Roadmap ───────────────────────────────────────────────────────────────────
export const roadmapApi = {
  list: (projectId: string) => req<RoadmapItem[]>(`/api/v1/projects/${projectId}/roadmap`),
  create: (projectId: string, body: { title: string; description?: string | null }) =>
    req<RoadmapItem>(`/api/v1/projects/${projectId}/roadmap`, { method: "POST", body: JSON.stringify(body) }),
  update: (projectId: string, itemId: string, body: Partial<RoadmapItem>) =>
    req<RoadmapItem>(`/api/v1/projects/${projectId}/roadmap/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (projectId: string, itemId: string) =>
    req<void>(`/api/v1/projects/${projectId}/roadmap/${itemId}`, { method: "DELETE" }),
  split: (projectId: string, itemId: string) =>
    req<{ tasks: import("@/types").SplitPreviewTask[] }>(
      `/api/v1/projects/${projectId}/roadmap/${itemId}/split`,
      { method: "POST" },
    ),
};
