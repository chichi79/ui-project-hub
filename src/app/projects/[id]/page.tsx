import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getComments,
  getProgressUpdates,
  getProjectById,
} from "@/lib/db";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatDate,
  parseTags,
} from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";
import { getDisplayThumbnail } from "@/lib/thumbnail-display";
import { CommentSection } from "@/components/CommentSection";
import { OwnerPanel } from "@/components/ProjectDetailClient";

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
  const tags = parseTags(project.tags);
  const imageSrc = getDisplayThumbnail(project.thumbnail);

  return (
    <div>
      <Link href="/" className="btn-ghost -ml-3 mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        목록
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <article className="card overflow-hidden">
            <div className="relative aspect-[16/9] w-full bg-zinc-100">
              <Image
                src={imageSrc}
                alt={project.title}
                fill
                className="object-cover"
                unoptimized
                priority
              />
            </div>

            <div className="p-6 sm:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className={`badge border ${STATUS_COLORS[project.status as ProjectStatus]}`}>
                  {STATUS_LABELS[project.status as ProjectStatus]}
                </span>
                <span className="text-sm tabular-nums text-zinc-400">{project.progress}%</span>
              </div>

              <h1 className="mb-4 text-2xl font-semibold tracking-tight text-zinc-900">
                {project.title}
              </h1>

              <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                {project.description || "설명이 없습니다."}
              </p>

              {tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-6 h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                <span>{project.author}</span>
                <span>등록 {formatDate(project.created_at)}</span>
                <span>수정 {formatDate(project.updated_at)}</span>
              </div>

              {(project.repo_url || project.demo_url) && (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-100 pt-6">
                  {project.demo_url && (
                    <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs">
                      데모 보기
                    </a>
                  )}
                  {project.repo_url && (
                    <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs">
                      저장소
                    </a>
                  )}
                </div>
              )}
            </div>
          </article>

          <CommentSection projectId={project.id} comments={comments} />
        </div>

        <OwnerPanel project={project} progressUpdates={progressUpdates} />
      </div>
    </div>
  );
}
