"use client";

import { useEffect, useState } from "react";
import { getOwnerSession } from "@/lib/owner-session";

export function useOwnerSession(projectId: number) {
  const [password, setPassword] = useState<string | null>(null);

  useEffect(() => {
    function sync() {
      setPassword(getOwnerSession(projectId));
    }
    sync();
    window.addEventListener(`hub-owner-change-${projectId}`, sync);
    return () => window.removeEventListener(`hub-owner-change-${projectId}`, sync);
  }, [projectId]);

  return { unlocked: Boolean(password), password: password || "" };
}
