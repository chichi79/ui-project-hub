import { NextRequest, NextResponse } from "next/server";
import { addProgressUpdate, getProjectRecordById } from "@/lib/db";
import type { ProjectStatus } from "@/lib/types";
import { verifyPassword } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  const project = await getProjectRecordById(projectId);

  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!verifyPassword(body.password || "", project.password_hash)) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    const progress = Math.min(100, Math.max(0, Number(body.progress) || 0));
    const update = await addProgressUpdate(projectId, {
      author: project.author,
      status: (body.status as ProjectStatus) || "in_progress",
      progress,
      note: body.note?.trim() || "",
    });
    return NextResponse.json(update, { status: 201 });
  } catch {
    return NextResponse.json({ error: "진행상황 업데이트 실패" }, { status: 500 });
  }
}
