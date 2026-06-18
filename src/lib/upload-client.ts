const MAX_SIZE = 5 * 1024 * 1024;

function isLocalHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

function uniqueFilename(original: string): string {
  const ext = original.split(".").pop()?.toLowerCase() || "jpg";
  return `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

async function uploadViaServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "업로드 실패");
  return data.url as string;
}

async function uploadViaBlobClient(file: File): Promise<string> {
  const { upload } = await import("@vercel/blob/client");
  const blob = await upload(uniqueFilename(file.name), file, {
    access: "public",
    handleUploadUrl: "/api/upload",
  });
  return blob.url;
}

/** 브라우저에서 이미지 파일 업로드. 로컬은 서버 저장, 배포 환경은 Blob 클라이언트 업로드 우선 */
export async function uploadImageFile(file: File): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error("파일 크기는 5MB 이하여야 합니다.");
  }

  if (isLocalHost()) {
    return uploadViaServer(file);
  }

  try {
    return await uploadViaBlobClient(file);
  } catch (blobError) {
    try {
      return await uploadViaServer(file);
    } catch {
      throw blobError instanceof Error ? blobError : new Error("업로드 실패");
    }
  }
}
