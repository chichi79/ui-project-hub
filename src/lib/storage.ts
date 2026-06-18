import fs from "fs";
import path from "path";
import { compressImageForStorage, DATA_URL_TARGET_BYTES } from "./image-compress";
import { uploadToFirebaseStorage } from "./firebase-storage";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

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
  let uploadBuffer = buffer;
  let contentType = mimeForExt(ext);
  let uploadExt = ext;

  const blobToken = getBlobToken();

  if (process.env.VERCEL && !blobToken) {
    const compressed = await compressImageForStorage(buffer);
    uploadBuffer = compressed.buffer;
    contentType = compressed.contentType;
    uploadExt = compressed.ext;
  }

  const filename = makeFilename(uploadExt);

  if (blobToken) {
    return saveToVercelBlob(filename, uploadBuffer, contentType);
  }

  const firebaseUrl = await uploadToFirebaseStorage(uploadBuffer, filename, contentType);
  if (firebaseUrl) return firebaseUrl;

  if (!process.env.VERCEL && uploadBuffer.length > DATA_URL_TARGET_BYTES) {
    const compressed = await compressImageForStorage(uploadBuffer);
    uploadBuffer = compressed.buffer;
    contentType = compressed.contentType;
  }

  if (process.env.VERCEL) {
    if (uploadBuffer.length > DATA_URL_TARGET_BYTES) {
      throw new Error("이미지를 저장할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    }
    return `data:${contentType};base64,${uploadBuffer.toString("base64")}`;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadsDir, filename), uploadBuffer);
  return `/uploads/${filename}`;
}

export async function saveUploadedFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  return saveImageBuffer(buffer, ext);
}
