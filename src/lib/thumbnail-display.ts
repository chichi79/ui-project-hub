export const DEFAULT_THUMBNAIL = "/images/default-project.svg";

/** Vercel 프로덕션에는 /uploads 로컬 경로 파일이 없음 */
function isUnavailableLocalUpload(thumbnail: string): boolean {
  if (!thumbnail.startsWith("/uploads/")) return false;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]";
  }
  return process.env.VERCEL === "1";
}

export function getDisplayThumbnail(thumbnail: string | null | undefined): string {
  const value = thumbnail?.trim();
  if (!value || isUnavailableLocalUpload(value)) {
    return DEFAULT_THUMBNAIL;
  }
  return value;
}

/** 프로덕션에 저장하면 안 되는 로컬 uploads 경로 제거 */
export function sanitizeThumbnailForSave(thumbnail: string): string | null {
  const value = thumbnail.trim();
  if (!value) return null;
  if (process.env.VERCEL === "1" && value.startsWith("/uploads/")) {
    return null;
  }
  return value;
}
