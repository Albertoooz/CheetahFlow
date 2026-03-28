import { BoardPageClient } from "@/components/kanban/BoardPageClient";

export const dynamic = "force-dynamic";

export default async function ProjectBoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <BoardPageClient projectId={projectId} />;
}
