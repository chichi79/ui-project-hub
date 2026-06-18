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
  if (!getBlobToken()) {
    throw new Error(
      "Blob Storage 토큰이 없습니다. Vercel 환경 변수를 확인한 뒤 재배포해 주세요."
    );
  }

  const { put } = await import("@vercel/blob");
  const uploadPromise = put(`uploads/${filename}`, buffer, {
    access: "public",
    contentType,
    token: getBlobToken(),
    addRandomSuffix: true,
  });

  // Vercel 함수 maxDuration(30s) 이전에 명시적으로 타임아웃
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Blob 업로드 타임아웃. 잠시 후 다시 시도해 주세요.")), 20_000)
  );

  const blob = await Promise.race([uploadPromise, timeoutPromise]);
  return blob.url;
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
