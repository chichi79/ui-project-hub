import { NextRequest, NextResponse } from "next/server";
import { resolveImageMime } from "@/lib/image-mime";
import { saveImageBuffer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

async function handleFormUpload(request: NextRequest) {
  console.log("[upload] start, content-type:", request.headers.get("content-type"));
  const formData = await request.formData();
  console.log("[upload] formData parsed");
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "파일 크기는 5MB 이하여야 합니다." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const buffer = Buffer.from(bytes);
  console.log("[upload] buffer size:", buffer.length, "BLOB_READ_WRITE_TOKEN set:", !!process.env.BLOB_READ_WRITE_TOKEN, "FIREBASE_STORAGE_BUCKET set:", !!process.env.FIREBASE_STORAGE_BUCKET);
  const mime = resolveImageMime(file, bytes);

  if (!mime) {
    return NextResponse.json(
      { error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." },
      { status: 400 }
    );
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    mime.replace("image/", "").replace("jpeg", "jpg");
  const url = await saveImageBuffer(buffer, ext);
  console.log("[upload] done, url type:", url.startsWith("data:") ? "dataURL" : url.startsWith("http") ? "http" : "local");
  return NextResponse.json({ url });
}

export async function POST(request: NextRequest) {
  try {
    return await handleFormUpload(request);
  } catch (err) {
    console.error("Upload failed:", err);
    const message = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
