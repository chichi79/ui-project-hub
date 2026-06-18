import { NextRequest, NextResponse } from "next/server";
import { addComment, getProjectById } from "@/lib/db";
import { isFeedbackType } from "@/lib/feedback";
import type { FeedbackType } from "@/lib/types";
import { revalidateProjectPages } from "@/lib/revalidate";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);

  if (!(await getProjectById(projectId))) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!body.author?.trim() || !body.content?.trim()) {
      return NextResponse.json(
        { error: "작성자와 내용은 필수입니다." },
        { status: 400 }
      );
    }

    const parentId = body.parent_id ? Number(body.parent_id) : null;
    const type: FeedbackType | undefined =
      body.type && isFeedbackType(body.type) ? body.type : undefined;

    if (!parentId && !type) {
      return NextResponse.json({ error: "피드백 유형을 선택해 주세요." }, { status: 400 });
    }

    const comment = await addComment(projectId, {
      author: body.author.trim(),
      content: body.content.trim(),
      type,
      parent_id: parentId,
    });
    revalidateProjectPages(projectId);
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "의견 등록 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
