import { NextRequest, NextResponse } from "next/server";
import { getProjectRecordById, updateProject } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { regenerateProjectThumbnail } from "@/lib/thumbnail";
import { pickSiteUrl } from "@/lib/url";

type Params = { params: Promise<{ id: string }> };

export const maxDuration = 30;

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  const existing = await getProjectRecordById(projectId);

  if (!existing) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!verifyPassword(body.password || "", existing.password_hash)) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }

    const siteUrl = pickSiteUrl(existing.demo_url, existing.repo_url);
    if (!siteUrl) {
      return NextResponse.json(
        { error: "데모 URL 또는 저장소 URL이 필요합니다." },
        { status: 400 }
      );
    }

    const thumbnail = await regenerateProjectThumbnail(siteUrl);
    const project = await updateProject(projectId, { thumbnail });

    if (!project) {
      return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err) {
    console.error("썸네일 재캡처 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "썸네일 재캡처 실패" },
      { status: 500 }
    );
  }
}
