"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus } from "@/lib/types";
import { STATUS_LABELS, normalizeUrl } from "@/lib/utils";
import ImageUpload from "./ImageUpload";

const STATUSES: ProjectStatus[] = ["idea", "in_progress", "review", "done", "on_hold"];

interface ProjectEditFormProps {
  project: Project;
  password: string;
  onCancel: () => void;
}

export default function ProjectEditForm({ project, password, onCancel }: ProjectEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(project.thumbnail);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const demoUrl = normalizeUrl((form.get("demo_url") as string) || "");
    const repoUrl = normalizeUrl((form.get("repo_url") as string) || "");

    const body = {
      password,
      title: form.get("title") as string,
      description: form.get("description") as string,
      status: form.get("status") as ProjectStatus,
      progress: Number(form.get("progress")),
      repo_url: repoUrl,
      demo_url: demoUrl,
      tags: form.get("tags") as string,
      thumbnail: thumbnail || "",
    };

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "수정 실패");
      router.refresh();
      onCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "수정 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border-t border-zinc-100 pt-5">
      <h3 className="text-sm font-medium text-zinc-900">프로젝트 수정</h3>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>}

      <ImageUpload value={thumbnail} onChange={setThumbnail} label="캡처 이미지 (선택)" hint="직접 업로드 시 URL 캡처보다 우선" />

      <input name="title" required defaultValue={project.title} className="input-field" placeholder="프로젝트명" />
      <textarea name="description" rows={4} defaultValue={project.description} className="input-field resize-none" placeholder="설명" />

      <div className="grid gap-3 sm:grid-cols-2">
        <select name="status" defaultValue={project.status} className="input-field">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <input name="progress" type="number" min={0} max={100} defaultValue={project.progress} className="input-field" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input name="repo_url" type="text" defaultValue={project.repo_url || ""} className="input-field" placeholder="저장소 URL" />
        <input name="demo_url" type="text" defaultValue={project.demo_url || ""} className="input-field" placeholder="데모 URL" />
      </div>

      <input name="tags" defaultValue={project.tags} className="input-field" placeholder="태그 (쉼표 구분)" />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary text-sm">취소</button>
        <button type="submit" disabled={loading} className="btn-primary text-sm">
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
