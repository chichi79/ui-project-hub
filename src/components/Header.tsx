import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-brand-100/80 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <img
            src="/images/ui-project-hub-mark.svg"
            alt="UI Project Hub"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold tracking-tightish text-zinc-900">
              <span className="text-brand-700">UI</span>
              <span className="font-medium text-zinc-600"> Project Hub</span>
            </p>
            <p className="text-caption mt-0.5 hidden sm:block">
              UI 팀 자체 프로젝트 & 아이디어 보드
            </p>
          </div>
        </Link>

        <Link
          href="/projects/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 프로젝트
        </Link>
      </div>
    </header>
  );
}
