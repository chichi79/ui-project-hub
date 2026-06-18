import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getComments,
  getProgressUpdates,
  getProjectById,
} from "@/lib/db";
import ProjectDetailView from "@/components/ProjectDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) notFound();

  const comments = await getComments(project.id);
  const progressUpdates = await getProgressUpdates(project.id);

  return (
    <div>
      <Link href="/" className="btn-ghost -ml-3 mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        목록
      </Link>

      <ProjectDetailView
        initialProject={project}
        comments={comments}
        progressUpdates={progressUpdates}
      />
    </div>
  );
}
