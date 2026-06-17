import { normalizeUrl } from "./utils";

export function pickSiteUrl(
  demoUrl?: string | null,
  repoUrl?: string | null
): string | null {
  const demo = demoUrl?.trim();
  if (demo) return demo;
  const repo = repoUrl?.trim();
  return repo || null;
}

export function getSiteUrlFromForm(demoUrl: string, repoUrl: string): string {
  return pickSiteUrl(normalizeUrl(demoUrl), normalizeUrl(repoUrl)) || "";
}
