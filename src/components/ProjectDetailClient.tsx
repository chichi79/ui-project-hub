"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus, ProgressUpdate } from "@/lib/types";
import { captureUrlThumbnail } from "@/lib/capture-client";
import { pickSiteUrl } from "@/lib/url";
import ProgressForm from "./ProgressForm";
import ProjectEditForm from "./ProjectEditForm";
import { setOwnerSession, clearOwnerSession } from "@/lib/owner-session";
import {
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  STATUS_LABELS,
  formatDate,
} from "@/lib/utils";

interface OwnerPanelProps {
  project: Project;
  progressUpdates: ProgressUpdate[];
}

export function OwnerPanel({ project, progressUpdates }: OwnerPanelProps) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [recapturing, setRecapturing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${project.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "비밀번호 확인 실패");
      setUnlocked(true);
      setOwnerSession(project.id, password);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 확인 실패");
    } finally {
      setLoading(false);
    }
  }

  function handleLock() {
    setUnlocked(false);
    setEditing(false);
    setConfirmDelete(false);
    setPassword("");
    clearOwnerSession(project.id);
    setError("");
  }

  async function handleDelete() {
    if (!password.trim()) {
      setError("비밀번호를 다시 확인해 주세요. 잠금 후 비밀번호를 입력하세요.");
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects/${project.id}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      let data: { error?: string; success?: boolean } = {};
      try {
        data = await res.json();
      } catch {
        throw new Error("서버 응답 오류가 발생했습니다.");
      }

      if (!res.ok) throw new Error(data.error || "삭제 실패");

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  }

  async function handleRecapture() {
    const siteUrl = pickSiteUrl(project.demo_url, project.repo_url);
    if (!siteUrl) {
      setError("데모 URL 또는 저장소 URL이 필요합니다.");
      return;
    }

    setRecapturing(true);
    setError("");
    try {
      const captured = await captureUrlThumbnail(siteUrl);
      if (!captured) throw new Error("화면 캡처에 실패했습니다. 직접 이미지를 업로드해 주세요.");

      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, thumbnail: captured }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "썸네일 저장 실패");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "캡처 실패");
    } finally {
      setRecapturing(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        {!unlocked ? (
          <>
            <h2 className="section-title mb-1">프로젝트 관리</h2>
            <p className="section-desc mb-5">
              비밀번호 확인 후 프로젝트 수정·삭제 및 피드백 상태 변경이 가능합니다.
            </p>
            <form onSubmit={handleUnlock} className="space-y-3">
              {error && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
              )}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="비밀번호"
                required
              />
              <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
                {loading ? "확인 중..." : "확인"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title">진행 업데이트</h2>
              <div className="flex gap-1">
                {!editing && (
                  <button onClick={() => setEditing(true)} className="btn-ghost text-xs">
                    수정
                  </button>
                )}
                <button onClick={handleLock} className="btn-ghost text-xs">
                  잠금
                </button>
              </div>
            </div>
            {error && (
              <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
            )}
            <ProgressForm
              projectId={project.id}
              password={password}
              currentStatus={project.status as ProjectStatus}
              currentProgress={project.progress}
            />

            {(project.demo_url || project.repo_url) && (
              <button
                type="button"
                onClick={handleRecapture}
                disabled={recapturing}
                className="btn-secondary mt-3 w-full text-sm"
              >
                {recapturing ? "캡처 중..." : "썸네일 다시 캡처"}
              </button>
            )}

            {editing && (
              <ProjectEditForm
                project={project}
                password={password}
                onCancel={() => setEditing(false)}
              />
            )}

            <div className="mt-6 border-t border-zinc-100 pt-5">
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-zinc-400 transition hover:text-rose-600"
                >
                  프로젝트 삭제
                </button>
              ) : (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <p className="mb-3 text-sm text-rose-800">
                    정말 삭제하시겠습니까? 의견과 진행 이력도 함께 삭제됩니다.
                  </p>
                  {error && (
                    <p className="mb-3 text-sm text-rose-700">{error}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                    >
                      {deleting ? "삭제 중..." : "삭제"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setConfirmDelete(false); setError(""); }}
                      disabled={deleting}
                      className="btn-secondary py-1.5 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <ProgressHistory updates={progressUpdates} />
    </div>
  );
}

function ProgressHistory({ updates }: { updates: ProgressUpdate[] }) {
  return (
    <section className="card p-6">
      <h2 className="section-title mb-5">진행 이력</h2>
      {updates.length === 0 ? (
        <p className="text-sm text-zinc-400">아직 업데이트 이력이 없습니다.</p>
      ) : (
        <div className="space-y-0">
          {updates.map((u, i) => (
            <div key={u.id} className="relative flex gap-3 pb-5 last:pb-0">
              {i < updates.length - 1 && (
                <div className="absolute left-[5px] top-3 h-full w-px bg-zinc-200" />
              )}
              <div className={`relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_COLORS[u.status as ProjectStatus]}`} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`badge border text-[11px] ${STATUS_COLORS[u.status as ProjectStatus]}`}>
                    {STATUS_LABELS[u.status as ProjectStatus]}
                  </span>
                  <span className="text-xs tabular-nums text-zinc-500">{u.progress}%</span>
                </div>
                {u.note && <p className="mb-1 text-sm text-zinc-600">{u.note}</p>}
                <p className="text-xs text-zinc-400">
                  {u.author} · {formatDate(u.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
