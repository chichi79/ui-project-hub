import { normalizeUrl } from "./utils";

async function uploadBlob(blob: Blob, filename = "capture.jpg"): Promise<string> {
  const formData = new FormData();
  formData.append("file", blob, filename);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "업로드 실패");
  return data.url;
}

async function fetchImageAsBlob(imageUrl: string): Promise<Blob> {
  const res = await fetch(imageUrl, { mode: "cors" });
  if (!res.ok) throw new Error("이미지 fetch 실패");
  const blob = await res.blob();
  if (blob.size < 500) throw new Error("유효하지 않은 이미지");
  return blob;
}

async function captureViaMshots(siteUrl: string): Promise<string> {
  const mshot = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(siteUrl)}?w=800`;
  const blob = await fetchImageAsBlob(mshot);
  return uploadBlob(blob);
}

async function captureViaMicrolink(siteUrl: string): Promise<string> {
  const api = `https://api.microlink.io/?url=${encodeURIComponent(siteUrl)}&screenshot=true&meta=false`;
  const res = await fetch(api);
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

/** 브라우저에서 사이트 화면 캡처 후 서버에 업로드 */
export async function captureUrlThumbnail(rawUrl: string): Promise<string | null> {
  const siteUrl = normalizeUrl(rawUrl);
  if (!siteUrl) return null;

  const methods = [
    () => captureViaMshots(siteUrl),
    () => captureViaMicrolink(siteUrl),
    () => captureViaThumIo(siteUrl),
  ];

  for (const method of methods) {
    try {
      return await method();
    } catch {
      // try next
    }
  }
  return null;
}
