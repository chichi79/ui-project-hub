"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment, Project, ProjectStatus, ProgressUpdate } from "@/lib/types";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  formatDate,
  parseTags,
} from "@/lib/utils";
import ProjectThumbnail from "@/components/ProjectThumbnail";
import { CommentSection } from "@/components/CommentSection";
import { OwnerPanel } from "@/components/ProjectDetailClient";

interface ProjectDetailViewProps {
  initialProject: Project;
  comments: Comment[];
  progressUpdates: ProgressUpdate[];
}

export default function ProjectDetailView({
  initialProject,
  comments,
  progressUpdates,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);

  function handleProjectUpdate(updated: Project) {
    setProject(updated);
    router.refresh();
  }

  const tags = parseTags(project.tags);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <article className="card overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="relative mx-auto h-28 w-44 shrink-0 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 sm:mx-0 sm:h-32 sm:w-48">
                <ProjectThumbnail
                  key={`${project.id}-${project.updated_at}`}
                  src={project.thumbnail}
                  alt={project.title}
                  className="object-cover object-top"
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className={`badge border ${STATUS_COLORS[project.status as ProjectStatus]}`}>
                    {STATUS_LABELS[project.status as ProjectStatus]}
                  </span>
                  <span className="text-sm tabular-nums text-zinc-400">{project.progress}%</span>
                </div>

                <h1 className="mb-3 text-2xl font-semibold leading-tight tracking-tightish text-zinc-900 sm:text-[1.75rem]">
                  {project.title}
                </h1>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                  <span>{project.author}</span>
                  <span>등록 {formatDate(project.created_at)}</span>
                  <span>수정 {formatDate(project.updated_at)}</span>
                </div>

                {(project.repo_url || project.demo_url) && (
                  <div className="mt-4 flex flex-wrap gap-2">
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
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-6">
              <p className="text-body whitespace-pre-wrap">
                {project.description || "설명이 없습니다."}
              </p>

              {tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-5 h-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-brand-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        </article>

        <CommentSection projectId={project.id} comments={comments} />
      </div>

      <OwnerPanel
        project={project}
        progressUpdates={progressUpdates}
        onProjectUpdate={handleProjectUpdate}
      />
    </div>
  );
}
