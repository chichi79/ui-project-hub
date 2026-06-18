import type { Metadata } from "next";
import type { Project } from "./types";
import { STATUS_LABELS } from "./utils";

const SITE_NAME = "UI Project Hub";
const SITE_DESCRIPTION = "UI 팀 자체 프로젝트와 아이디어를 모아보는 허브";

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export function getSiteMetadata(): Pick<Metadata, "metadataBase" | "title" | "description" | "openGraph" | "twitter"> {
  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: ["/opengraph-image"],
    },
  };
}

function isShareableImageUrl(url: string): boolean {
  if (!/^https:\/\//i.test(url)) return false;
  if (url.startsWith("data:")) return false;
  return !/\.svg($|\?)/i.test(url);
}

export function getProjectShareDescription(project: Project): string {
  const parts = [
    project.description?.trim(),
    `${project.author} · ${STATUS_LABELS[project.status]} · ${project.progress}%`,
  ].filter(Boolean);
  const text = parts.join(" — ");
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export function getProjectOgImagePath(project: Project): string {
  const thumbnail = project.thumbnail?.trim();
  if (thumbnail && isShareableImageUrl(thumbnail)) {
    return thumbnail;
  }
  return `/projects/${project.id}/opengraph-image`;
}
