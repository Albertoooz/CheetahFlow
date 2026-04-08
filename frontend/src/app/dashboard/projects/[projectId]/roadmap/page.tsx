import { RoadmapView } from "@/components/roadmap/RoadmapView";

export default async function RoadmapPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <RoadmapView projectId={projectId} />;
}
