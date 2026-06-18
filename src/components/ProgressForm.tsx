"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/utils";
import ProgressSlider from "@/components/ProgressSlider";

const STATUSES: ProjectStatus[] = ["idea", "in_progress", "review", "done", "on_hold"];

interface ProgressFormProps {
  projectId: number;
  password: string;
  currentStatus: ProjectStatus;
  currentProgress: number;
  onUpdated?: (status: ProjectStatus, progress: number) => void;
}

export default function ProgressForm({
  projectId,
  password,
  currentStatus,
  currentProgress,
  onUpdated,
}: ProgressFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(currentProgress);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const body = {
      password,
      status: form.get("status") as ProjectStatus,
      progress: Number(form.get("progress")),
      note: form.get("note") as string,
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업데이트 실패");
      onUpdated?.(body.status, body.progress);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "업데이트 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <select name="status" defaultValue={currentStatus} className="input-field">
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>

      <ProgressSlider value={progress} onChange={setProgress} />

      <textarea
        name="note"
        rows={2}
        className="input-field resize-none"
        placeholder="업데이트 메모 (선택)"
      />

      <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
        {loading ? "저장 중..." : "업데이트"}
      </button>
    </form>
  );
}
