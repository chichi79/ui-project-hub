"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/types";
import { FEEDBACK_TYPE_LABELS } from "@/lib/feedback";

interface CommentTickerProps {
  comments: Pick<Comment, "author" | "content" | "type">[];
}

export default function CommentTicker({ comments }: CommentTickerProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (comments.length <= 1) return;

    const interval = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % comments.length);
        setVisible(true);
      }, 250);
    }, 4500);

    return () => clearInterval(interval);
  }, [comments.length]);

  if (comments.length === 0) return null;

  const comment = comments[index];

  return (
    <div className="mb-3 border-l-2 border-brand-200 pl-3">
      <span className="mb-1 inline-block text-[10px] font-medium text-brand-600">
        {FEEDBACK_TYPE_LABELS[comment.type]}
      </span>
      <p
        className={`h-5 truncate text-xs leading-5 text-zinc-500 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-medium text-zinc-600">{comment.author}</span>
        <span className="mx-1 text-zinc-300">—</span>
        {comment.content.replace(/\s+/g, " ")}
      </p>
    </div>
  );
}
