import type { ProjectStatus } from "./types";

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "아이디어",
  in_progress: "진행중",
  review: "리뷰중",
  done: "완료",
  on_hold: "보류",
};

export const STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  idea: "구상·기획 단계의 아이디어 프로젝트",
  in_progress: "디자인·개발이 진행 중인 프로젝트",
  review: "내부 리뷰·피드백을 받는 단계",
  done: "완료되어 공유·운영 중인 프로젝트",
  on_hold: "일시 중단하거나 보류한 프로젝트",
};

export const STATUS_COLORS: Record<ProjectStatus, string> = {
  idea: "border-zinc-200 bg-zinc-50 text-zinc-600",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  on_hold: "border-rose-200 bg-rose-50 text-rose-600",
};

export const STATUS_DOT_COLORS: Record<ProjectStatus, string> = {
  idea: "bg-zinc-400",
  in_progress: "bg-sky-500",
  review: "bg-amber-500",
  done: "bg-emerald-500",
  on_hold: "bg-rose-400",
};

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function parseTags(tags: string): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
