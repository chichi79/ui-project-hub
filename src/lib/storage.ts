import fs from "fs";
import path from "path";
import { uploadToFirebaseStorage } from "./firebase-storage";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

/** Firestore 문서 크기를 고려한 data URL용 최대 바이트 */
const DATA_URL_TARGET_BYTES = 280_000;

function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
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
    throw new Error("Blob Storage 토큰이 없습니다.");
  }

  const { put } = await import("@vercel/blob");
  const blob = await put(filename, buffer, {
    access: "public",
    contentType,
    token,
    addRandomSuffix: false,
  });
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
