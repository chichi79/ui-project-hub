"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const current = searchParams.get("status") || "all";

  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-zinc-200/80 bg-white p-1.5 sm:grid-cols-6 sm:gap-2 sm:p-2 lg:grid-cols-6">
      {items.map((item) => {
        const key = item.status || "all";
        const active = key === current;

        return (
          <Link
            key={item.label}
            href={key === "all" ? "/" : `/?status=${key}`}
            className={`rounded-lg px-1.5 py-2 text-center transition sm:px-2 lg:px-2.5 lg:py-2 ${
              active
                ? "bg-brand-50 ring-1 ring-brand-200"
                : "hover:bg-zinc-50"
            }`}
          >
            <p className={`text-[10px] sm:text-xs ${active ? "font-medium text-brand-700" : "text-zinc-500"}`}>
              {item.label}
            </p>
            <p
              className={`mt-0.5 text-lg font-semibold tabular-nums sm:text-xl ${
                active ? "text-brand-700" : "text-zinc-900"
              }`}
            >
              {item.value}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
