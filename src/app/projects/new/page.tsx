"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProjectStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/utils";
import ImageUpload from "@/components/ImageUpload";
import AuthorInput from "@/components/AuthorInput";
import { captureUrlThumbnail } from "@/lib/capture-client";
import { getSiteUrlFromForm } from "@/lib/url";
import { setUserName } from "@/lib/user";
import { normalizeUrl } from "@/lib/utils";

const STATUSES: ProjectStatus[] = ["idea", "in_progress", "review", "done", "on_hold"];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const passwordConfirm = form.get("password_confirm") as string;

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    const author = (form.get("author") as string).trim();
    setUserName(author);

    const demoUrl = normalizeUrl((form.get("demo_url") as string) || "");
    const repoUrl = normalizeUrl((form.get("repo_url") as string) || "");

    let finalThumbnail = thumbnail;
    const siteUrl = getSiteUrlFromForm(demoUrl, repoUrl);
    if (!finalThumbnail && siteUrl) {
      setCapturing(true);
      try {
        const captured = await captureUrlThumbnail(siteUrl);
        if (captured) finalThumbnail = captured;
      } catch {
        // 캡처 실패 시 서버에서 SVG 썸네일 생성
      } finally {
        setCapturing(false);
      }
    }

    setLoading(true);
    const body = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      author,
      password,
      status: form.get("status") as ProjectStatus,
      progress: Number(form.get("progress")) || 0,
      repo_url: repoUrl,
      demo_url: demoUrl,
      tags: form.get("tags") as string,
      thumbnail: finalThumbnail || "",
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "등록 실패");
      }
      const project = await res.json();
      router.replace(`/?registered=${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link href="/" className="btn-ghost -ml-3 mb-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          목록
        </Link>
        <h1 className="page-title">프로젝트 등록</h1>
        <p className="page-desc">누구나 등록할 수 있습니다. 수정 시 비밀번호가 필요합니다.</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <Field label="프로젝트명" required>
          <input name="title" required className="input-field" placeholder="예: AI 컴포넌트 생성기" />
        </Field>

        <Field label="설명">
          <textarea
            name="description"
            rows={4}
            className="input-field resize-none"
            placeholder="프로젝트 목적과 주요 기능을 설명해 주세요."
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="작성자" required>
            <AuthorInput />
          </Field>
          <Field label="상태">
            <select name="status" defaultValue="idea" className="input-field">
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="수정 비밀번호" required hint="4자 이상">
            <input name="password" type="password" required minLength={4} className="input-field" placeholder="비밀번호" />
          </Field>
          <Field label="비밀번호 확인" required>
            <input name="password_confirm" type="password" required minLength={4} className="input-field" placeholder="비밀번호 확인" />
          </Field>
        </div>

        <Field label="진행률 (%)">
          <input name="progress" type="number" min={0} max={100} defaultValue={0} className="input-field" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="저장소 URL" hint="https:// 없이 입력 가능">
            <input name="repo_url" type="text" className="input-field" placeholder="github.com/..." />
          </Field>
          <Field label="데모 URL" hint="등록 시 사이트 화면을 캡처해 썸네일로 사용">
            <input name="demo_url" type="text" className="input-field" placeholder="example.com" />
          </Field>
        </div>

        <ImageUpload value={thumbnail} onChange={setThumbnail} label="캡처 이미지 (선택)" hint="미입력 시 데모/저장소 URL에서 자동 캡처" />

        <Field label="태그" hint="쉼표로 구분">
          <input name="tags" className="input-field" placeholder="AI, React, 자동화" />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/" className="btn-secondary">취소</Link>
          <button type="submit" disabled={loading || capturing} className="btn-primary">
            {capturing ? "화면 캡처 중..." : loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
        {hint && <span className="ml-2 text-xs font-normal text-zinc-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
