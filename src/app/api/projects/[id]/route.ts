import { NextRequest, NextResponse } from "next/server";
import {
  deleteProject,
  getComments,
  getProgressUpdates,
  getProjectById,
  getProjectRecordById,
  updateProject,
} from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { generateProjectThumbnail, regenerateProjectThumbnail } from "@/lib/thumbnail";
import { pickSiteUrl } from "@/lib/url";
import { normalizeUrl } from "@/lib/utils";
import { revalidateProjectPages } from "@/lib/revalidate";
import { sanitizeThumbnailForSave } from "@/lib/thumbnail-display";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const project = await getProjectById(Number(id));
  if (!project) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }
  const comments = await getComments(project.id);
  const progressUpdates = await getProgressUpdates(project.id);
  return NextResponse.json({ project, comments, progressUpdates });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
  const existing = await getProjectRecordById(projectId);

  if (!existing) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    const body = await request.json();
    if (!verifyPassword(body.password || "", existing.password_hash)) {
      return NextResponse.json(
        { error: "비밀번호가 일치하지 않습니다." },
        { status: 403 }
      );
    }

    const { password: _, thumbnail: bodyThumbnail, ...rest } = body;

    if (rest.demo_url !== undefined) rest.demo_url = normalizeUrl(rest.demo_url || "") || null;
    if (rest.repo_url !== undefined) rest.repo_url = normalizeUrl(rest.repo_url || "") || null;
    if (rest.progress !== undefined) rest.progress = Number(rest.progress) || 0;

    const demoUrl = rest.demo_url !== undefined ? rest.demo_url : existing.demo_url;
    const repoUrl = rest.repo_url !== undefined ? rest.repo_url : existing.repo_url;

    let thumbnail = existing.thumbnail;
    if (bodyThumbnail?.trim()) {
      const sanitized = sanitizeThumbnailForSave(bodyThumbnail);
      if (!sanitized) {
        return NextResponse.json(
          { error: "유효하지 않은 썸네일입니다. 이미지를 다시 업로드해 주세요." },
          { status: 400 }
        );
      }
      thumbnail = sanitized;
    } else if (bodyThumbnail === "") {
      const siteUrl = pickSiteUrl(demoUrl, repoUrl);
      thumbnail = siteUrl ? await regenerateProjectThumbnail(siteUrl) : null;
    }

    const project = await updateProject(projectId, {
      ...rest,
      thumbnail: thumbnail ?? undefined,
    });

    revalidateProjectPages(projectId);

    return NextResponse.json(project);
  } catch (err) {
    console.error("프로젝트 수정 실패:", err);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const projectId = Number(id);
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

  let password = "";
  try {
    const body = await request.json();
    password = body.password || "";
  } catch {
    return NextResponse.json({ error: "비밀번호가 필요합니다." }, { status: 400 });
  }

  if (!password.trim()) {
    return NextResponse.json({ error: "비밀번호를 입력해 주세요." }, { status: 400 });
  }

  if (!verifyPassword(password, existing.password_hash)) {
    return NextResponse.json(
      { error: "비밀번호가 일치하지 않습니다." },
      { status: 403 }
    );
  }

  await deleteProject(projectId);
  revalidateProjectPages(projectId);
  return NextResponse.json({ success: true });
}
