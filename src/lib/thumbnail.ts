import { pickSiteUrl } from "./url";
import { saveImageBuffer } from "./storage";

function resolveImageUrl(imageUrl: string, baseUrl: string): string {
  try {
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return imageUrl;
  }
}

function extractMetaImage(html: string, baseUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return resolveImageUrl(match[1], baseUrl);
  }
  return null;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** 네트워크 없이도 동작하는 URL 기반 미리보기 썸네일 */
export async function generateUrlThumbnail(siteUrl: string): Promise<string> {
  const hostname = getHostname(siteUrl);
  const displayHost = escapeXml(hostname);
  const displayUrl = escapeXml(siteUrl.length > 60 ? `${siteUrl.slice(0, 57)}...` : siteUrl);
  const hash = hostname.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${hue},65%,92%)"/>
      <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},55%,85%)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <rect x="60" y="60" width="680" height="330" rx="16" fill="white" fill-opacity="0.85"/>
  <circle cx="120" cy="120" r="36" fill="hsl(${hue},60%,55%)"/>
  <text x="120" y="130" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" fill="white">🌐</text>
  <text x="180" y="115" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#1e293b">${displayHost}</text>
  <text x="180" y="148" font-family="system-ui,sans-serif" font-size="16" fill="#64748b">${displayUrl}</text>
  <rect x="180" y="200" width="520" height="12" rx="6" fill="#e2e8f0"/>
  <rect x="180" y="230" width="400" height="12" rx="6" fill="#e2e8f0"/>
  <rect x="180" y="260" width="300" height="12" rx="6" fill="#e2e8f0"/>
  <rect x="180" y="310" width="140" height="40" rx="8" fill="hsl(${hue},60%,55%)"/>
  <text x="250" y="336" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="white">Demo</text>
</svg>`;

  return saveImageBuffer(Buffer.from(svg, "utf-8"), "svg");
}

async function downloadAndSave(imageUrl: string): Promise<string> {
  const res = await fetch(imageUrl, {
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; UIProjectHub/1.0)" },
  });
  if (!res.ok) throw new Error("이미지 다운로드 실패");

  const contentType = res.headers.get("content-type") || "";
  const ext = contentType.includes("png") ? "png" : contentType.includes("svg") ? "svg" : "jpg";
  const buffer = Buffer.from(await res.arrayBuffer());

  if (buffer.length < 200) throw new Error("유효하지 않은 이미지");

  return saveImageBuffer(buffer, ext);
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function generateProjectThumbnail(siteUrl: string): Promise<string> {
  const url = siteUrl.trim();
  if (!isValidHttpUrl(url)) {
    throw new Error("유효하지 않은 URL");
  }

  const fastMethods = [
    () => captureViaMicrolink(url, 10_000),
    () => captureViaPageMeta(url, 5_000),
  ];

  for (const method of fastMethods) {
    try {
      const result = await method();
      if (result) return result;
    } catch {
      // try next
    }
  }

  return generateUrlThumbnail(url);
}

async function captureViaPageMeta(siteUrl: string, timeoutMs = 15_000): Promise<string | null> {
  const res = await fetch(siteUrl, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: { "User-Agent": "Mozilla/5.0 (compatible; UIProjectHub/1.0)" },
    redirect: "follow",
  });
  if (!res.ok) return null;

  const html = await res.text();
  const imageUrl = extractMetaImage(html, siteUrl);
  if (!imageUrl) return null;

  return downloadAndSave(imageUrl);
}

async function captureViaMicrolink(siteUrl: string, timeoutMs = 20_000): Promise<string | null> {
  const api =
    `https://api.microlink.io/?url=${encodeURIComponent(siteUrl)}` +
    "&screenshot=true&meta=false&viewport.width=1280&viewport.height=720";
  const res = await fetch(api, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) return null;

  const json = await res.json();
  const shotUrl = json?.data?.screenshot?.url as string | undefined;
  if (!shotUrl) return null;

  return downloadAndSave(shotUrl);
}

async function captureViaMshots(siteUrl: string): Promise<string | null> {
  const mshot = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(siteUrl)}?w=800`;
  return downloadAndSave(mshot);
}

async function captureRealScreenshot(siteUrl: string): Promise<string | null> {
  const methods = [
    () => captureViaMicrolink(siteUrl),
    () => captureViaPageMeta(siteUrl),
    () => captureViaMshots(siteUrl),
  ];

  for (const method of methods) {
    try {
      const result = await method();
      if (result) return result;
    } catch {
      // try next
    }
  }
  return null;
}

export async function tryRealCapture(siteUrl: string): Promise<string | null> {
  const url = siteUrl.trim();
  if (!isValidHttpUrl(url)) return null;
  return captureRealScreenshot(url);
}

export async function captureSiteThumbnail(siteUrl: string): Promise<string | null> {
  const url = siteUrl.trim();
  if (!isValidHttpUrl(url)) return null;

  const real = await captureRealScreenshot(url);
  return real || generateUrlThumbnail(url);
}

export async function resolveProjectThumbnail(
  manualThumbnail: string | null | undefined,
  demoUrl?: string | null,
  repoUrl?: string | null
): Promise<string | null> {
  if (manualThumbnail?.trim()) return manualThumbnail.trim();

  const siteUrl = pickSiteUrl(demoUrl, repoUrl);
  if (!siteUrl) return null;

  return captureSiteThumbnail(siteUrl);
}
