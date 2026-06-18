import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "UI Project Hub",
  description: "UI 팀 자체 프로젝트와 아이디어를 모아보는 허브",
  icons: {
    icon: [{ url: "/images/ui-project-hub-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/images/ui-project-hub-mark.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "UI Project Hub",
    description: "UI 팀 자체 프로젝트와 아이디어를 모아보는 허브",
    images: [{ url: "/images/ui-project-hub-mark.svg", width: 64, height: 64, alt: "UI Project Hub" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen font-sans">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
