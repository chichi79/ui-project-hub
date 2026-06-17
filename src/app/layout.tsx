import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "UI Project Hub",
  description: "UI 팀 자체 프로젝트와 아이디어를 모아보는 허브",
  icons: {
    icon: "/images/ui-project-hub-mark.svg",
    apple: "/images/ui-project-hub-mark.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
