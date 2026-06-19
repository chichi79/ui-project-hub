import { NextRequest, NextResponse } from "next/server";
import { resolveImageMime } from "@/lib/image-mime";
import { saveImageBuffer } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { data?: string; name?: string; type?: string };

    if (!body.data) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }

    const buffer = Buffer.from(body.data, "base64");

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(buffer);
    const mime = resolveImageMime({ name: body.name ?? "", type: body.type ?? "" } as File, bytes);

    if (!mime) {
      return NextResponse.json(
        { error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const ext =
      (body.name ?? "").split(".").pop()?.toLowerCase() ||
      mime.replace("image/", "").replace("jpeg", "jpg");

    const url = await saveImageBuffer(buffer, ext);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload failed:", err);
    const message = err instanceof Error ? err.message : "업로드 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
