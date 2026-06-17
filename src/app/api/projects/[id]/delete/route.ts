import { NextRequest, NextResponse } from "next/server";
import { deleteProject, getProjectRecordById } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

async function verifyAndDelete(projectId: number, password: string) {
  const existing = await getProjectRecordById(projectId);

  if (!existing) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  if (!existing.password_hash) {
    return NextResponse.json(
      { error: "비밀번호가 설정되지 않은 프로젝트는 삭제할 수 없습니다." },
      { status: 403 }
    );
  }

  if (!password?.trim()) {
    return NextResponse.json({ error: "비밀번호를 입력해 주세요." }, { status: 400 });
  }

  if (!verifyPassword(password, existing.password_hash)) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않습니다." },
      { status: 403 }
    );
  }

  await deleteProject(projectId);
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    return verifyAndDelete(Number(id), body.password || "");
  } catch {
    return NextResponse.json({ error: "비밀번호가 필요합니다." }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    return verifyAndDelete(Number(id), body.password || "");
  } catch {
    return NextResponse.json({ error: "비밀번호가 필요합니다." }, { status: 400 });
  }
}
