import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/db";
import { OgProjectImage } from "@/lib/og-image";
import { STATUS_LABELS } from "@/lib/utils";

export const runtime = "nodejs";
export const alt = "프로젝트 미리보기";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface PageProps {
  params: Promise<{ id: string }>;
}

function isOgThumbnail(url: string | null | undefined): url is string {
  if (!url?.trim()) return false;
  if (!/^https:\/\//i.test(url)) return false;
  return !/\.svg($|\?)/i.test(url);
}

export default async function OpenGraphImage({ params }: PageProps) {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) notFound();

  return OgProjectImage({
    title: project.title,
    author: project.author,
    statusLabel: STATUS_LABELS[project.status],
    progress: project.progress,
    description: project.description,
    thumbnailUrl: isOgThumbnail(project.thumbnail) ? project.thumbnail : null,
  });
}
