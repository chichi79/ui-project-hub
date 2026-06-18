import fs from "fs";
import path from "path";
import { put } from "@vercel/blob";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

export async function saveImageBuffer(buffer: Buffer, ext: string): Promise<string> {
  const filename = `capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: mimeForExt(ext),
    });
    return blob.url;
  }

  // Vercel serverless: writable filesystem 없음 → 작은 이미지는 data URL로 저장
  if (process.env.VERCEL) {
    const maxDataUrlBytes = 100_000;
    if (buffer.length > maxDataUrlBytes) {
      throw new Error("Vercel에서 큰 이미지 업로드는 Blob Storage 연결이 필요합니다.");
    }
    const mime = mimeForExt(ext);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

function mimeForExt(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "svg") return "image/svg+xml";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export async function saveUploadedFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const buffer = Buffer.from(await file.arrayBuffer());
  return saveImageBuffer(buffer, ext);
}
