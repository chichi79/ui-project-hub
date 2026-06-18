import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateCommentStatus } from "@/lib/db";
import { isFeedbackStatus } from "@/lib/feedback";
import { revalidateProjectPages } from "@/lib/revalidate";

type Params = { params: Promise<{ id: string; commentId: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, commentId } = await params;
  const projectId = Number(id);
  const cid = Number(commentId);

  if (!(await getProjectById(projectId))) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!body.password) {
      return NextResponse.json({ error: "비밀번호가 필요합니다." }, { status: 400 });
    }
    if (!body.status || !isFeedbackStatus(body.status)) {
      return NextResponse.json({ error: "유효하지 않은 상태입니다." }, { status: 400 });
    }

    const updated = await updateCommentStatus(projectId, cid, body.status, body.password);
    if (!updated) {
      return NextResponse.json({ error: "의견을 찾을 수 없습니다." }, { status: 404 });
    }

    revalidateProjectPages(projectId);

    return NextResponse.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "상태 변경 실패";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
