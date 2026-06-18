"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FeedbackType } from "@/lib/types";
import { FEEDBACK_TYPE_LABELS, FEEDBACK_TYPES } from "@/lib/feedback";
import { getUserName, setUserName } from "@/lib/user";

interface CommentFormProps {
  projectId: number;
  parentId?: number;
  onSuccess?: () => void;
  compact?: boolean;
}

export default function CommentForm({
  projectId,
  parentId,
  onSuccess,
  compact,
}: CommentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [type, setType] = useState<FeedbackType>("idea");

  useEffect(() => {
    setAuthor(getUserName());
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      author: form.get("author") as string,
      content: form.get("content") as string,
    };
    if (parentId) {
      body.parent_id = parentId;
    } else {
      body.type = type;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const authorName = (form.get("author") as string).trim();
        if (authorName) setUserName(authorName);
        (e.target as HTMLFormElement).reset();
        setAuthor(getUserName());
        router.refresh();
        onSuccess?.();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={compact ? "space-y-2" : "space-y-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4"}
    >
      {!parentId && (
        <div className="flex flex-wrap gap-1.5">
          {FEEDBACK_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                type === t
                  ? "border-brand-300 bg-brand-100 text-brand-800"
                  : "border-zinc-200 bg-white text-zinc-500 hover:border-brand-200"
              }`}
            >
              {FEEDBACK_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      )}

      <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-[120px_1fr]"}`}>
        <input
          name="author"
          required
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="input-field"
          placeholder="이름"
        />
        <textarea
          name="content"
          required
          rows={compact ? 2 : 2}
          className="input-field resize-none"
          placeholder={parentId ? "답글을 남겨주세요" : "의견을 남겨주세요"}
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          {loading ? "등록 중..." : parentId ? "답글 등록" : "등록"}
        </button>
      </div>
    </form>
  );
}
