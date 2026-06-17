import { NextRequest, NextResponse } from "next/server";
import { getProjectRecordById } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const project = await getProjectRecordById(Number(id));

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!project.password_hash) {
    return NextResponse.json(
      { error: "이 프로젝트는 비밀번호가 설정되지 않았습니다." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const valid = verifyPassword(body.password || "", project.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: "비밀번호 확인 실패" }, { status: 400 });
  }
}
