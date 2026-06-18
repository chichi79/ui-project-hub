import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_IMAGE_TYPES, resolveImageMime } from "@/lib/image-mime";
import { saveImageBuffer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = (await request.json()) as HandleUploadBody;
      const jsonResponse = await handleUpload({
        body,
        request,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: [...ALLOWED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_SIZE,
        }),
        onUploadCompleted: async () => {},
      });
      return NextResponse.json(jsonResponse);
    } catch (err) {
      console.error("Blob client upload failed:", err);
      const message =
        err instanceof Error ? err.message : "Blob 업로드에 실패했습니다.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  try {
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
    const url = await saveImageBuffer(Buffer.from(bytes), ext);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload failed:", err);
    const message = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
