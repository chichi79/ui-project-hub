import type { FeedbackStatus, FeedbackType } from "./types";

export const FEEDBACK_TYPES: FeedbackType[] = ["praise", "improvement", "question", "idea"];

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  praise: "칭찬",
  improvement: "개선",
  question: "질문",
  idea: "아이디어",
};

export const FEEDBACK_TYPE_COLORS: Record<FeedbackType, string> = {
  praise: "border-emerald-200 bg-emerald-50 text-emerald-700",
  improvement: "border-amber-200 bg-amber-50 text-amber-700",
  question: "border-sky-200 bg-sky-50 text-sky-700",
  idea: "border-violet-200 bg-violet-50 text-violet-700",
};

export const FEEDBACK_STATUSES: FeedbackStatus[] = [
  "unread",
  "acknowledged",
  "planned",
  "done",
];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  unread: "미확인",
  acknowledged: "확인함",
  planned: "반영 예정",
  done: "반영 완료",
};

export const FEEDBACK_STATUS_COLORS: Record<FeedbackStatus, string> = {
  unread: "border-zinc-200 bg-zinc-50 text-zinc-500",
  acknowledged: "border-sky-200 bg-sky-50 text-sky-700",
  planned: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-brand-200 bg-brand-50 text-brand-700",
};

export function isFeedbackType(value: string): value is FeedbackType {
  return FEEDBACK_TYPES.includes(value as FeedbackType);
}

export function isFeedbackStatus(value: string): value is FeedbackStatus {
  return FEEDBACK_STATUSES.includes(value as FeedbackStatus);
}
