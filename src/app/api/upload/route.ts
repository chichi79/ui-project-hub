import { NextRequest, NextResponse } from "next/server";
import { resolveImageMime } from "@/lib/image-mime";
import { createBlobClientToken, getBlobReadWriteToken } from "@/lib/blob-token";
import { saveImageBuffer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

async function handleTokenRequest(request: NextRequest) {
  const body = (await request.json()) as {
    pathname?: string;
    contentType?: string;
  };

  if (!getBlobReadWriteToken()) {
    return NextResponse.json({ mode: "server" as const });
  }

  const pathname =
    body.pathname?.trim() ||
    `uploads/capture-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const clientToken = await createBlobClientToken(pathname);
  return NextResponse.json({
    mode: "blob" as const,
    clientToken,
    pathname,
  });
}

async function handleFormUpload(request: NextRequest) {
  const formData = await request.formData();
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
  return NextResponse.json({ url });
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      return await handleTokenRequest(request);
    }
    return await handleFormUpload(request);
  } catch (err) {
    console.error("Upload failed:", err);
    const message = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
