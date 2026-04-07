import { WorkflowEditorPage } from "@/components/workflows/WorkflowEditorPage";

export default async function EditWorkflowPage({ params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params;
  return <WorkflowEditorPage workflowId={workflowId} />;
}
