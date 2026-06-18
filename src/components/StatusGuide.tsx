import type { ProjectStatus } from "@/lib/types";
import { STATUS_COLORS, STATUS_DESCRIPTIONS, STATUS_LABELS } from "@/lib/utils";

const STATUSES: ProjectStatus[] = ["idea", "in_progress", "review", "done", "on_hold"];

export default function StatusGuide() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-900">프로젝트 상태 안내</h3>
      <p className="mb-4 text-xs text-zinc-500">등록 시 현재 단계에 맞는 상태를 선택해 주세요.</p>
      <ul className="space-y-2.5">
        {STATUSES.map((status) => (
          <li key={status} className="flex items-start gap-2.5 text-sm">
            <span className={`badge mt-0.5 shrink-0 border ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <span className="leading-relaxed text-zinc-600">{STATUS_DESCRIPTIONS[status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
