import { ProjectSettingsShell } from "@/components/projects/ProjectSettingsShell";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return <ProjectSettingsShell projectId={projectId} />;
}
