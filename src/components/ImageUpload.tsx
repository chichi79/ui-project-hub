"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
}

export default function ImageUpload({ value, onChange, label = "캡처 이미지", hint }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "업로드 실패");
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-zinc-400">{hint}</span>}
      </label>
      {value ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200">
          <div className="relative aspect-video w-full bg-zinc-100">
            <Image src={value} alt="캡처 이미지" fill className="object-cover" unoptimized />
          </div>
          <div className="flex gap-2 border-t border-zinc-100 p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary flex-1 text-xs"
            >
              {uploading ? "업로드 중..." : "변경"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="btn-secondary text-xs text-zinc-500"
            >
              삭제
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 py-7 text-sm text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <svg className="h-6 w-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
          </svg>
          {uploading ? "업로드 중..." : "이미지 업로드"}
          <span className="text-xs text-zinc-400">JPG, PNG, WebP, GIF</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
