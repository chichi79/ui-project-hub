import Link from "next/link";
import type { Comment, Project, ProjectStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS, formatDate, parseTags } from "@/lib/utils";
import CommentTicker from "@/components/CommentTicker";
import ProjectThumbnail from "@/components/ProjectThumbnail";

interface ProjectCardProps {
  project: Project;
  comments?: Pick<Comment, "author" | "content" | "type">[];
}

export default function ProjectCard({ project, comments = [] }: ProjectCardProps) {
  const tags = parseTags(project.tags);

  return (
    <Link
      href={`/projects/${project.id}`}
      className="card group flex flex-col overflow-hidden transition hover:border-brand-200 hover:shadow-soft"
    >
      <div className="relative aspect-[16/10] w-full bg-zinc-100">
        <ProjectThumbnail src={project.thumbnail} alt={project.title} className="object-cover transition duration-500 group-hover:scale-[1.02]" />
        <span
          className={`absolute left-3 top-3 rounded-full border px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ${STATUS_COLORS[project.status as ProjectStatus]}`}
        >
          {STATUS_LABELS[project.status as ProjectStatus]}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1.5 line-clamp-1 text-[15px] font-medium text-zinc-900 group-hover:text-brand-700">
          {project.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-500">
          {project.description || "설명 없음"}
        </p>

        <CommentTicker comments={comments} />

        <div className="mt-auto space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-zinc-400">{project.progress}%</span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[11px] text-zinc-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-zinc-100 pt-3 text-xs text-zinc-400">
            <span>{project.author}</span>
            <span>{formatDate(project.updated_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
