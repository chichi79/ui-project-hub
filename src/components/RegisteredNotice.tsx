"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function RegisteredNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registeredId = searchParams.get("registered");

  if (!registeredId) return null;

  function dismiss() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("registered");
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/");
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
      <p>
        프로젝트가 등록되었습니다.{" "}
        <Link href={`/projects/${registeredId}`} className="font-medium text-brand-700 underline-offset-2 hover:underline">
          상세 보기
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="btn-ghost shrink-0 text-zinc-400"
        aria-label="닫기"
      >
        ✕
      </button>
    </div>
  );
}
