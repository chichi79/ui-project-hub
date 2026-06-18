import fs from "fs";
import path from "path";
import { uploadToFirebaseStorage } from "./firebase-storage";
import { getBlobReadWriteToken } from "./blob-token";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

/** Firestore 문서 크기를 고려한 data URL용 최대 바이트 */
const DATA_URL_TARGET_BYTES = 280_000;

function getBlobToken(): string | undefined {
  return getBlobReadWriteToken();
}

function makeFilename(ext: string): string {
  return `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

function mimeForExt(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

async function saveToVercelBlob(
  filename: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const token = getBlobToken();
  if (!token) {
    throw new Error(
      "Blob Storage 토큰이 없습니다. Vercel 환경 변수를 확인한 뒤 재배포해 주세요."
    );
  }

  // SDK의 ReadableStream 변환이 서버리스 환경에서 hang되는 경우가 있어
  // Vercel Blob REST API를 직접 fetch로 호출합니다.
  const suffix = `-${Math.random().toString(36).slice(2, 8)}`;
  const nameWithSuffix = filename.replace(/(\.[^.]+)$/, `${suffix}$1`);
  const blobPath = `/uploads/${nameWithSuffix}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const bodyBytes = new Uint8Array(buffer);
    const res = await fetch(`https://blob.vercel-storage.com${blobPath}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${token}`,
        "x-api-version": "9",
        "x-content-type": contentType,
        // 서버(Node.js)에서 content-length 없으면 Vercel Blob이 무한 대기함
        "x-content-length": String(bodyBytes.byteLength),
      },
      body: bodyBytes,
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `Blob 업로드 실패 (${res.status})${errText ? `: ${errText.slice(0, 120)}` : ""}`
      );
    }

    const data = (await res.json()) as { url: string };
    if (!data.url) throw new Error("Blob URL을 받지 못했습니다.");
    return data.url;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Blob 업로드 타임아웃. 잠시 후 다시 시도해 주세요.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function saveImageBuffer(buffer: Buffer, ext: string): Promise<string> {
  const contentType = mimeForExt(ext);
  const filename = makeFilename(ext);
  const blobToken = getBlobToken();

  if (blobToken) {
    return saveToVercelBlob(filename, buffer, contentType);
  }

  const firebaseUrl = await uploadToFirebaseStorage(buffer, filename, contentType);
  if (firebaseUrl) return firebaseUrl;

  if (process.env.VERCEL) {
    if (buffer.length > DATA_URL_TARGET_BYTES) {
      throw new Error("이미지가 너무 큽니다. 더 작은 이미지를 사용해 주세요.");
    }
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  return saveImageBuffer(buffer, ext);
}
