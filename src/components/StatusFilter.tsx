"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { STATUS_LABELS } from "@/lib/utils";

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "idea", label: STATUS_LABELS.idea },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "review", label: STATUS_LABELS.review },
  { value: "done", label: STATUS_LABELS.done },
  { value: "on_hold", label: STATUS_LABELS.on_hold },
];

export default function StatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("status") || "all";

  function handleChange(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="-mb-px flex gap-1 overflow-x-auto">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => handleChange(f.value)}
          className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition ${
            current === f.value
              ? "border-brand-600 font-medium text-brand-700"
              : "border-transparent text-zinc-400 hover:text-brand-600"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
