import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

const BRAND_GREEN = "#16a35f";
const BRAND_GREEN_LIGHT = "#4ade94";

export function OgSiteImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: `linear-gradient(135deg, ${BRAND_GREEN_LIGHT} 0%, ${BRAND_GREEN} 100%)`,
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
            }}
          >
            UI
          </div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>UI Project Hub</div>
        </div>
        <div>
          <div style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
            UI 팀 프로젝트 & 아이디어 보드
          </div>
          <div style={{ fontSize: 28, opacity: 0.92 }}>
            자체 프로젝트를 모아보고 의견을 나눕니다
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}

interface OgProjectImageProps {
  title: string;
  author: string;
  statusLabel: string;
  progress: number;
  description?: string;
  thumbnailUrl?: string | null;
}

export function OgProjectImage({
  title,
  author,
  statusLabel,
  progress,
  description,
  thumbnailUrl,
}: OgProjectImageProps) {
  const summary = description?.trim() || "UI 팀 자체 프로젝트";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f7faf8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {thumbnailUrl ? (
          <div
            style={{
              width: "42%",
              height: "100%",
              display: "flex",
              background: "#e4e4e7",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : null}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: BRAND_GREEN }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>UI Project Hub</div>
          </div>
          <div>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 16px",
                borderRadius: 999,
                background: "#dcfceb",
                color: BRAND_GREEN,
                fontSize: 20,
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              {statusLabel} · {progress}%
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                lineHeight: 1.15,
                color: "#18181b",
                marginBottom: 16,
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: 24, color: "#52525b", lineHeight: 1.4, marginBottom: 12 }}>
              {summary.length > 90 ? `${summary.slice(0, 87)}...` : summary}
            </div>
            <div style={{ fontSize: 22, color: "#71717a" }}>{author}</div>
          </div>
        </div>
      </div>
    ),
    OG_SIZE
  );
}
