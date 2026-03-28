import Link from "next/link";
import { ProjectTasksClient } from "@/components/projects/ProjectTasksClient";

export const dynamic = "force-dynamic";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <Link href={`/dashboard/projects/${projectId}`} className="text-sm text-slate-500 hover:text-slate-800">
        ← Board
      </Link>
      <div className="mt-4">
        <ProjectTasksClient projectId={projectId} />
      </div>
    </div>
  );
}
