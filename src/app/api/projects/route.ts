import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { createProject, getAllProjects, getProjectStats, updateProject } from "@/lib/db";
import { hashPassword, validatePasswordInput } from "@/lib/auth";
import { generateProjectThumbnail } from "@/lib/thumbnail";
import { pickSiteUrl } from "@/lib/url";
import { normalizeUrl } from "@/lib/utils";
import { revalidateProjectPages } from "@/lib/revalidate";

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
    const thumbnail = body.thumbnail?.trim() || null;
    const siteUrl = !thumbnail ? pickSiteUrl(demoUrl, repoUrl) : "";

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

    if (!thumbnail && siteUrl) {
      after(async () => {
        try {
          const generated = await generateProjectThumbnail(siteUrl);
          await updateProject(project.id, { thumbnail: generated });
          revalidateProjectPages(project.id);
        } catch (thumbErr) {
          console.warn("썸네일 생성 실패:", thumbErr);
        }
      });
    }

    revalidateProjectPages(project.id);

    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error("프로젝트 생성 실패:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "프로젝트 생성 실패" },
      { status: 500 }
    );
  }
}
