import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getComments,
  getProgressUpdates,
  getProjectById,
} from "@/lib/db";
import {
  getProjectOgImagePath,
  getProjectShareDescription,
} from "@/lib/site";
import BackToListLink from "@/components/BackToListLink";
import ProjectDetailView from "@/components/ProjectDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) {
    return { title: "프로젝트를 찾을 수 없습니다" };
  }

  const description = getProjectShareDescription(project);
  const image = getProjectOgImagePath(project);
  const imageEntry =
    typeof image === "string" && image.startsWith("http")
      ? { url: image, width: 1200, height: 630, alt: project.title }
      : { url: image, width: 1200, height: 630, alt: project.title };

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      url: `/projects/${project.id}`,
      type: "article",
      images: [imageEntry],
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: [typeof image === "string" && image.startsWith("http") ? image : imageEntry.url],
    },
  };
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) notFound();

  const comments = await getComments(project.id);
  const progressUpdates = await getProgressUpdates(project.id);

  return (
    <div>
      <BackToListLink className="btn-ghost -ml-3 mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        목록
      </BackToListLink>

      <ProjectDetailView
        initialProject={project}
        comments={comments}
        progressUpdates={progressUpdates}
      />
    </div>
  );
}
