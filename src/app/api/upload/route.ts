import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, resolveImageMime } from "@/lib/image-mime";
import { saveImageBuffer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || undefined;
}

async function handleBlobClientUpload(request: NextRequest) {
  const token = getBlobToken();
  if (!token) {
    return NextResponse.json(
      { error: "Blob Storage 토큰이 설정되지 않았습니다. Vercel에서 재배포해 주세요." },
      { status: 503 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;
  const jsonResponse = await handleUpload({
    body,
    request,
    token,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [...ALLOWED_IMAGE_TYPES, "image/jpg"],
      maximumSizeInBytes: MAX_SIZE,
      addRandomSuffix: true,
    }),
    onUploadCompleted: async () => {},
  });
  return NextResponse.json(jsonResponse);
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
  let mime = resolveImageMime(file, bytes);

  if (!mime) {
    try {
      const sharp = (await import("sharp")).default;
      const meta = await sharp(buffer).metadata();
      if (!meta.format) {
        return NextResponse.json(
          { error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." },
          { status: 400 }
        );
      }
      mime = "image/jpeg";
    } catch {
      return NextResponse.json(
        { error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." },
        { status: 400 }
      );
    }
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
      return await handleBlobClientUpload(request);
    }
    return await handleFormUpload(request);
  } catch (err) {
    console.error("Upload failed:", err);
    const message = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
