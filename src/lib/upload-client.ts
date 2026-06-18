const MAX_SIZE = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 60_000;

async function prepareImageForUpload(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (file.size < 100_000) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1280;
    let { width, height } = bitmap;

    if (width > maxSide || height > maxSide) {
      const scale = maxSide / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });
    if (!blob) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "upload";
    return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error("서버에서 이미지를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    if (!res.ok) throw new Error(`업로드 실패 (${res.status})`);
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
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error((data.error as string) || "업로드 실패");
    if (typeof data.url !== "string") {
      throw new Error("업로드 URL을 받지 못했습니다.");
    }
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

/** 브라우저에서 이미지 업로드 */
export async function uploadImageFile(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("파일 크기는 5MB 이하여야 합니다.");
  }

  const prepared = await prepareImageForUpload(file);
  return uploadViaServer(prepared);
}
