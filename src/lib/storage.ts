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
