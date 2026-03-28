"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { AgentConfig, AssigneeKind } from "@/types";

export function AssigneeSelector({
  label,
  kind,
  agentId,
  humanName,
  agents,
  onKindChange,
  onAgentIdChange,
  onHumanNameChange,
}: {
  label: string;
  kind: AssigneeKind | "" | null;
  agentId: string | null;
  humanName: string | null;
  agents: AgentConfig[];
  onKindChange: (k: AssigneeKind | null) => void;
  onAgentIdChange: (id: string | null) => void;
  onHumanNameChange: (name: string | null) => void;
}) {
  const k = kind || "";
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <Select
        value={k === "" ? "" : k}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onKindChange(null);
            onAgentIdChange(null);
            onHumanNameChange(null);
          } else {
            onKindChange(v as AssigneeKind);
            if (v === "human") {
              onAgentIdChange(null);
            } else {
              onHumanNameChange(null);
            }
          }
        }}
      >
        <option value="">Unassigned</option>
        <option value="agent">Agent</option>
        <option value="human">Human</option>
      </Select>
      {k === "agent" && (
        <Select
          value={agentId ?? ""}
          onChange={(e) => onAgentIdChange(e.target.value || null)}
        >
          <option value="">Select agent…</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.display_name} ({a.role_key})
            </option>
          ))}
        </Select>
      )}
      {k === "human" && (
        <Input
          placeholder="Name or email"
          value={humanName ?? ""}
          onChange={(e) => onHumanNameChange(e.target.value || null)}
        />
      )}
    </div>
  );
}
