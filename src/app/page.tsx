import { Suspense } from "react";
import Link from "next/link";
import { getAllProjects, getProjectStats, getRecentCommentsByProject } from "@/lib/db";
import ProjectCard from "@/components/ProjectCard";
import ProjectStatsBoard from "@/components/ProjectStatsBoard";
import StatusFilter from "@/components/StatusFilter";
import RegisteredNotice from "@/components/RegisteredNotice";
import { STATUS_LABELS } from "@/lib/utils";
import type { ProjectStatus } from "@/lib/types";

interface HomeProps {
  searchParams: Promise<{ status?: string }>;
}

export const dynamic = "force-dynamic";

const STATUS_ORDER: ProjectStatus[] = ["idea", "in_progress", "review", "done", "on_hold"];

export default async function Home({ searchParams }: HomeProps) {
  const { status } = await searchParams;
  const projects = await getAllProjects(status);
  const stats = await getProjectStats();
  const commentsByProject = await getRecentCommentsByProject();

  const statusCounts = Object.fromEntries(
    stats.byStatus.map((s) => [s.status, s.cnt])
  );

  const statItems = [
    { label: "전체", value: stats.total, status: "all" as const },
    ...STATUS_ORDER.map((s) => ({
      label: STATUS_LABELS[s],
      value: statusCounts[s] || 0,
      status: s,
    })),
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">프로젝트</h1>
        <p className="page-desc">UI 팀의 자체 프로젝트를 모아보고 의견을 나눕니다.</p>
        <div className="mt-5">
          <Suspense fallback={<div className="h-[72px] rounded-xl border border-zinc-200/80 bg-white" />}>
            <ProjectStatsBoard items={statItems} />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <RegisteredNotice />
      </Suspense>

      <div className="mb-8 border-b border-zinc-200">
        <Suspense fallback={<div className="h-10" />}>
          <StatusFilter />
        </Suspense>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="mb-1 text-sm font-medium text-zinc-700">등록된 프로젝트가 없습니다</p>
          <p className="mb-6 text-sm text-zinc-400">첫 번째 프로젝트를 등록해 보세요.</p>
          <Link href="/projects/new" className="btn-primary">
            프로젝트 등록
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} comments={commentsByProject[p.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
