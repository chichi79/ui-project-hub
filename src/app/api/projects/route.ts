import { NextRequest, NextResponse } from "next/server";
import { createProject, getAllProjects, getProjectStats } from "@/lib/db";
import { hashPassword, validatePasswordInput } from "@/lib/auth";
import { generateUrlThumbnail } from "@/lib/thumbnail";
import { pickSiteUrl } from "@/lib/url";
import { normalizeUrl } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || undefined;
  const projects = await getAllProjects(status);
  const stats = await getProjectStats();
  return NextResponse.json({ projects, stats });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title?.trim() || !body.author?.trim()) {
      return NextResponse.json(
        { error: "제목과 작성자는 필수입니다." },
        { status: 400 }
      );
    }

    const passwordError = validatePasswordInput(body.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const demoUrl = normalizeUrl(body.demo_url || "");
    const repoUrl = normalizeUrl(body.repo_url || "");
    let thumbnail = body.thumbnail?.trim() || null;

    if (!thumbnail) {
      const siteUrl = pickSiteUrl(demoUrl, repoUrl);
      if (siteUrl) {
        try {
          thumbnail = await generateUrlThumbnail(siteUrl);
        } catch (thumbErr) {
          console.warn("썸네일 생성 실패, 기본 이미지 사용:", thumbErr);
        }
      }
    }

    const project = await createProject({
      title: body.title.trim(),
      description: (body.description || "").trim(),
      author: body.author.trim(),
      status: body.status || "idea",
      progress: Number(body.progress) || 0,
      repo_url: repoUrl || undefined,
      demo_url: demoUrl || undefined,
      tags: (body.tags || "").trim(),
      thumbnail: thumbnail || undefined,
      password_hash: hashPassword(body.password),
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("프로젝트 생성 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "프로젝트 생성 실패" },
      { status: 500 }
    );
  }
}
