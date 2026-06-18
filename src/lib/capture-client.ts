import { normalizeUrl } from "./utils";

const METHOD_TIMEOUT_MS = 10_000;
const TOTAL_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = METHOD_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function uploadBlob(blob: Blob, filename = "capture.jpg"): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  const res = await fetchWithTimeout("/api/upload", { method: "POST", body: formData }, METHOD_TIMEOUT_MS);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "업로드 실패");
  return data.url;
}

async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const res = await fetchWithTimeout(imageUrl, { mode: "cors" });
  if (!res.ok) throw new Error("이미지 fetch 실패");
  const blob = await res.blob();
  if (blob.size < 500) throw new Error("유효하지 않은 이미지");
  return blob;
}

async function captureViaMicrolink(siteUrl: string): Promise<string> {
  const api = `https://api.microlink.io/?url=${encodeURIComponent(siteUrl)}&screenshot=true&meta=false`;
  const res = await fetchWithTimeout(api);
  if (!res.ok) throw new Error("microlink 실패");
  const json = await res.json();
  const shotUrl = json?.data?.screenshot?.url as string | undefined;
  if (!shotUrl) throw new Error("스크린샷 URL 없음");
  const blob = await fetchImageAsBlob(shotUrl);
  return uploadBlob(blob);
}

async function captureViaThumIo(siteUrl: string): Promise<string> {
  const thum = `https://image.thum.io/get/width/800/noanimate/${siteUrl}`;
  const blob = await fetchImageAsBlob(thum);
  return uploadBlob(blob);
}

/** mshots는 첫 요청 시 수 분 대기할 수 있어 클라이언트에서는 사용하지 않음 */
async function captureUrlThumbnailInternal(rawUrl: string): Promise<string | null> {
  const siteUrl = normalizeUrl(rawUrl);
  if (!siteUrl) return null;

  const methods = [captureViaMicrolink, captureViaThumIo];

  for (const method of methods) {
    try {
      return await withTimeout(method(siteUrl), METHOD_TIMEOUT_MS);
    } catch {
      // try next
    }
  }
  return null;
}

/** 브라우저에서 사이트 화면 캡처 후 서버에 업로드. 실패·타임아웃 시 null */
export async function captureUrlThumbnail(rawUrl: string): Promise<string | null> {
  try {
    return await withTimeout(captureUrlThumbnailInternal(rawUrl), TOTAL_TIMEOUT_MS);
  } catch {
    return null;
  }
}
