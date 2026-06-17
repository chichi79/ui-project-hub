import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/storage";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "JPG, PNG, WebP, GIF만 업로드 가능합니다." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    const url = await saveUploadedFile(file);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
