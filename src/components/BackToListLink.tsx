"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";

interface BackToListLinkProps {
  className?: string;
  children: ReactNode;
}

export default function BackToListLink({ className, children }: BackToListLinkProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    startTransition(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <a
      href="/"
      onClick={handleClick}
      className={className}
      aria-busy={pending}
    >
      {children}
    </a>
  );
}
