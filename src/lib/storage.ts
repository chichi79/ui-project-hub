import fs from "fs";
import path from "path";
import { compressImageForStorage, DATA_URL_TARGET_BYTES } from "./image-compress";
import { uploadToFirebaseStorage } from "./firebase-storage";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

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

export async function saveImageBuffer(buffer: Buffer, ext: string): Promise<string> {
  let uploadBuffer = buffer;
  let contentType = mimeForExt(ext);
  let uploadExt = ext;

  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    const compressed = await compressImageForStorage(buffer);
    uploadBuffer = compressed.buffer;
    contentType = compressed.contentType;
    uploadExt = compressed.ext;
  }

  const filename = makeFilename(uploadExt);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, uploadBuffer, {
      access: "public",
      contentType,
    });
    return blob.url;
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
      throw new Error(
        "이미지를 저장할 수 없습니다. Vercel Blob Storage를 연결하거나 FIREBASE_STORAGE_BUCKET을 설정해 주세요."
      );
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
