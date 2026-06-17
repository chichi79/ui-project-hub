"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Comment, FeedbackStatus, FeedbackType } from "@/lib/types";
import {
  FEEDBACK_STATUS_COLORS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPE_COLORS,
  FEEDBACK_TYPE_LABELS,
  FEEDBACK_TYPES,
} from "@/lib/feedback";
import { formatDate } from "@/lib/utils";
import { useOwnerSession } from "@/lib/use-owner-session";
import CommentForm from "./CommentForm";

interface CommentSectionProps {
  projectId: number;
  comments: Comment[];
}

function buildThreads(comments: Comment[]) {
  const parents = comments.filter((c) => c.parent_id === null);
  const repliesByParent = new Map<number, Comment[]>();

  for (const c of comments) {
    if (c.parent_id === null) continue;
    const list = repliesByParent.get(c.parent_id) || [];
    list.push(c);
    repliesByParent.set(c.parent_id, list);
  }

  for (const [, replies] of repliesByParent) {
    replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  return { parents, repliesByParent };
}

export function CommentSection({ projectId, comments }: CommentSectionProps) {
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">("all");
  const { unlocked, password } = useOwnerSession(projectId);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return comments;
    return comments.filter(
      (c) =>
        (c.parent_id === null && c.type === typeFilter) ||
        (c.parent_id !== null &&
          comments.some((p) => p.id === c.parent_id && p.type === typeFilter))
    );
  }, [comments, typeFilter]);

  const { parents, repliesByParent } = useMemo(() => buildThreads(filtered), [filtered]);
  const topLevelCount = comments.filter((c) => c.parent_id === null).length;

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="section-title mb-4">
        피드백 <span className="font-normal text-zinc-400">{topLevelCount}</span>
      </h2>

      <CommentForm projectId={projectId} />

      <div className="mb-4 mt-5 flex flex-wrap gap-1.5">
        <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")} label="전체" />
        {FEEDBACK_TYPES.map((t) => (
          <FilterChip
            key={t}
            active={typeFilter === t}
            onClick={() => setTypeFilter(t)}
            label={FEEDBACK_TYPE_LABELS[t]}
          />
        ))}
      </div>

      <div className="divide-y divide-zinc-100">
        {parents.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">
            {typeFilter === "all" ? "아직 등록된 피드백이 없습니다." : "해당 유형의 피드백이 없습니다."}
          </p>
        ) : (
          parents.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) || []}
              projectId={projectId}
              unlocked={unlocked}
              password={password}
            />
          ))
        )}
      </div>
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-zinc-200 bg-white text-zinc-500 hover:border-brand-200"
      }`}
    >
      {label}
    </button>
  );
}

function CommentItem({
  comment,
  replies,
  projectId,
  unlocked,
  password,
}: {
  comment: Comment;
  replies: Comment[];
  projectId: number;
  unlocked: boolean;
  password: string;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  async function handleStatusChange(status: FeedbackStatus) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`badge border text-[11px] ${FEEDBACK_TYPE_COLORS[comment.type]}`}>
          {FEEDBACK_TYPE_LABELS[comment.type]}
        </span>
        <span className={`badge border text-[11px] ${FEEDBACK_STATUS_COLORS[comment.status]}`}>
          {FEEDBACK_STATUS_LABELS[comment.status]}
        </span>
        {unlocked && (
          <select
            value={comment.status}
            disabled={statusLoading}
            onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
            className="ml-auto rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600"
          >
            {FEEDBACK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FEEDBACK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-zinc-800">{comment.author}</span>
        <span className="shrink-0 text-xs text-zinc-400">{formatDate(comment.created_at)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">{comment.content}</p>

      <button
        type="button"
        onClick={() => setReplyOpen((v) => !v)}
        className="btn-ghost mt-2 text-xs"
      >
        {replyOpen ? "답글 닫기" : `답글 ${replies.length > 0 ? `(${replies.length})` : ""}`}
      </button>

      {replies.length > 0 && (
        <div className="mt-3 space-y-3 border-l-2 border-brand-100 pl-4">
          {replies.map((reply) => (
            <div key={reply.id}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-700">{reply.author}</span>
                <span className="text-[11px] text-zinc-400">{formatDate(reply.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-zinc-600">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {replyOpen && (
        <div className="mt-3 border-l-2 border-brand-200 pl-4">
          <CommentForm
            projectId={projectId}
            parentId={comment.id}
            compact
            onSuccess={() => setReplyOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
