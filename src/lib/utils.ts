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

const DISPLAY_TIME_ZONE = "Asia/Seoul";

/** Firestore/legacy 문자열을 일관되게 파싱 */
export function parseStoredDate(dateStr: string): Date {
  const trimmed = dateStr.trim();
  if (!trimmed) return new Date(NaN);

  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    return new Date(trimmed);
  }

  const match = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)/
  );
  if (match) {
    return new Date(`${match[1]}T${match[2]}+09:00`);
  }

  return new Date(trimmed);
}

/** Node(서버)와 브라우저에서 동일한 문자열을 보장하기 위해 sv-SE 중간 포맷 사용 */
export function formatDate(dateStr: string): string {
  const d = parseStoredDate(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const normalized = d.toLocaleString("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: DISPLAY_TIME_ZONE,
  });
  const [datePart, timePart] = normalized.split(" ");
  if (!datePart || !timePart) return dateStr;

  const [year, month, day] = datePart.split("-");
  const [hourStr, minute] = timePart.split(":");
  const hour24 = Number(hourStr);
  if (!year || !month || !day || Number.isNaN(hour24) || !minute) return dateStr;

  const period = hour24 < 12 ? "오전" : "오후";
  const hour12 = hour24 % 12 || 12;
  return `${year}년 ${Number(month)}월 ${Number(day)}일 ${period} ${hour12}:${minute}`;
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
