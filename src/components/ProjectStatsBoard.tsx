"use client";

import Link from "next/link";
import type { ProjectStatus } from "@/lib/types";

export interface StatBoardItem {
  label: string;
  value: number;
  status?: ProjectStatus | "all";
}

interface ProjectStatsBoardProps {
  items: StatBoardItem[];
}

export default function ProjectStatsBoard({ items }: ProjectStatsBoardProps) {
  const marqueeText = items.map((item) => `${item.label} ${item.value}`).join("   ·   ");

  return (
    <div className="signboard relative overflow-hidden rounded-xl border border-brand-500/35 bg-[#081810] px-4 py-3 shadow-[inset_0_0_30px_rgba(34,197,116,0.07)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(34,197,116,0.9)]" />
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-brand-400">
            UI Project Hub Live
          </span>
        </div>
        <span className="hidden font-mono text-[10px] text-brand-500/60 sm:inline">
          {new Date().toLocaleDateString("ko-KR")}
        </span>
      </div>

      <div className="mb-3 hidden flex-wrap gap-2 sm:flex">
        {items.map((item) => (
          <Link
            key={item.label}
            href={!item.status || item.status === "all" ? "/" : `/?status=${item.status}`}
            className="signboard-cell group rounded-md border border-brand-500/25 bg-black/35 px-3 py-1.5 transition hover:border-brand-400/60 hover:bg-brand-500/10"
          >
            <span className="text-[11px] text-brand-200/75">{item.label}</span>
            <span className="ml-2 font-mono text-base font-bold tabular-nums text-brand-300 text-shadow-glow group-hover:text-brand-200">
              {String(item.value).padStart(2, "0")}
            </span>
          </Link>
        ))}
      </div>

      <div className="signboard-marquee relative overflow-hidden">
        <div className="signboard-track flex w-max gap-12 whitespace-nowrap py-0.5">
          {[marqueeText, marqueeText].map((text, i) => (
            <span key={i} className="font-mono text-sm tracking-wide text-brand-300/90">
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
