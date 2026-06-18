import Link from "next/link";
import type { Comment, Project, ProjectStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_LABELS, normalizeUrl, parseTags } from "@/lib/utils";
import CommentTicker from "@/components/CommentTicker";
import FormattedDate from "@/components/FormattedDate";
import ProjectThumbnail from "@/components/ProjectThumbnail";

interface ProjectCardProps {
  project: Project;
  comments?: Pick<Comment, "author" | "content" | "type">[];
}

export default function ProjectCard({ project, comments = [] }: ProjectCardProps) {
  const tags = parseTags(project.tags);
  const demoUrl = project.demo_url?.trim();

  return (
    <div className="card group flex gap-4 p-4 transition hover:border-brand-200 hover:shadow-soft sm:gap-5 sm:p-5">
      <div className="flex w-[6.5rem] shrink-0 flex-col gap-1.5 sm:w-[7.5rem]">
        <Link
          href={`/projects/${project.id}`}
          className="relative block h-[4.5rem] overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50 sm:h-20"
        >
          <ProjectThumbnail
            src={project.thumbnail}
            alt={project.title}
            className="object-cover object-top transition duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        {demoUrl && (
          <a
            href={normalizeUrl(demoUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-md border border-zinc-200 bg-white px-2 py-1 text-center text-[10px] font-medium text-zinc-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            데모 바로가기
          </a>
        )}
      </div>

      <Link href={`/projects/${project.id}`} className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-[15px] font-semibold tracking-tightish text-zinc-900 group-hover:text-brand-700">
            {project.title}
          </h3>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[project.status as ProjectStatus]}`}
          >
            {STATUS_LABELS[project.status as ProjectStatus]}
          </span>
        </div>

        <p className="text-body mb-2 line-clamp-2 text-zinc-600">
          {project.description || "설명 없음"}
        </p>

        <CommentTicker comments={comments} />

        <div className="mt-auto space-y-2.5 pt-2">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-zinc-400">{project.progress}%</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-zinc-400">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="truncate">{project.author}</span>
              {tags.length > 0 && (
                <>
                  <span className="text-zinc-200">·</span>
                  <span className="truncate">
                    {tags.slice(0, 2).map((tag) => `#${tag}`).join(" ")}
                  </span>
                </>
              )}
            </div>
            <FormattedDate value={project.created_at} className="shrink-0" />
          </div>
        </div>
      </Link>
    </div>
  );
}
