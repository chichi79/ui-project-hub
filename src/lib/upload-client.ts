const MAX_SIZE = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60_000;

async function parseUploadResponse(res: Response): Promise<{ url?: string; error?: string }> {
  const text = await res.text();
  try {
    return JSON.parse(text) as { url?: string; error?: string };
  } catch {
    if (!res.ok) {
      throw new Error(`업로드 실패 (${res.status})`);
    }
    throw new Error("업로드 응답을 읽을 수 없습니다.");
  }
}

async function uploadViaServer(file: File): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    const data = await parseUploadResponse(res);
    if (!res.ok) throw new Error(data.error || "업로드 실패");
    if (!data.url) throw new Error("업로드 URL을 받지 못했습니다.");
    return data.url;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("업로드 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** 브라우저에서 이미지 파일 업로드 (서버에서 Blob / Firebase / 로컬 저장 처리) */
export async function uploadImageFile(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("파일 크기는 5MB 이하여야 합니다.");
  }
  return uploadViaServer(file);
}
