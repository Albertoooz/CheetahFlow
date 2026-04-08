export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type AssigneeKind = "agent" | "human";

export interface AgentConfig {
  id: string;
  workspace_id: string;
  role_key: string;
  display_name: string;
  model_provider: string;
  model_name: string;
  enabled: boolean;
  instructions: string | null;
  capabilities: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  columns: string[];
  task_count: number;
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
  project_id: string | null;
  roadmap_item_id: string | null;
  title: string;
  body: string | null;
  workflow_definition_id: string | null;
  stage_overrides: Record<string, unknown> | null;
  status: string;
  position: number;
  priority: TaskPriority;
  assignee_type: AssigneeKind | null;
  assignee_agent_id: string | null;
  assignee_human_name: string | null;
  reviewer_type: AssigneeKind | null;
  reviewer_agent_id: string | null;
  reviewer_human_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoadmapItem {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "draft" | "splitting" | "ready" | "in_progress" | "done";
  created_at: string;
  updated_at: string;
}

export interface SplitPreviewTask {
  title: string;
  body: string | null;
  priority: TaskPriority;
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
