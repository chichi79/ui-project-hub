"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProjectStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/utils";
import ImageUpload from "@/components/ImageUpload";
import AuthorInput from "@/components/AuthorInput";
import { setUserName } from "@/lib/user";
import { normalizeUrl } from "@/lib/utils";
import { DEFAULT_PROJECT_PASSWORD } from "@/lib/auth";
import ProgressSlider from "@/components/ProgressSlider";
import StatusGuide from "@/components/StatusGuide";

const STATUSES: ProjectStatus[] = ["idea", "in_progress", "review", "done", "on_hold"];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
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
      thumbnail: thumbnail || "",
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
        <p className="page-desc">누구나 등록할 수 있습니다. 수정·삭제 시 비밀번호가 필요합니다.</p>
      </div>

      <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
        기본 수정 비밀번호는 <strong>{DEFAULT_PROJECT_PASSWORD}</strong>입니다. 등록 시 그대로 두거나 원하는 비밀번호로 변경할 수 있습니다.
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
          <Field label="상태" hint="아래 안내 참고">
            <select name="status" defaultValue="idea" className="input-field">
              {STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
        </div>

        <StatusGuide />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="수정 비밀번호" required hint={`기본값 ${DEFAULT_PROJECT_PASSWORD}`}>
            <input
              name="password"
              type="password"
              required
              minLength={4}
              defaultValue={DEFAULT_PROJECT_PASSWORD}
              className="input-field"
              placeholder="비밀번호"
            />
          </Field>
          <Field label="비밀번호 확인" required>
            <input
              name="password_confirm"
              type="password"
              required
              minLength={4}
              defaultValue={DEFAULT_PROJECT_PASSWORD}
              className="input-field"
              placeholder="비밀번호 확인"
            />
          </Field>
        </div>

        <ProgressSlider value={progress} onChange={setProgress} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="저장소 URL" hint="https:// 없이 입력 가능">
            <input name="repo_url" type="text" className="input-field" placeholder="github.com/..." />
          </Field>
          <Field label="데모 URL" hint="등록 시 서버에서 URL 미리보기 썸네일 생성">
            <input name="demo_url" type="text" className="input-field" placeholder="example.com" />
          </Field>
        </div>

        <ImageUpload value={thumbnail} onChange={setThumbnail} label="썸네일 이미지 (선택)" hint="미입력 시 데모/저장소 URL로 자동 생성" />

        <Field label="태그" hint="쉼표로 구분">
          <input name="tags" className="input-field" placeholder="AI, React, 자동화" />
        </Field>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/" className="btn-secondary">취소</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "등록 중..." : "등록하기"}
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
