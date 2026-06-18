import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import Header from "@/components/Header";
import { getSiteMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...getSiteMetadata(),
  icons: {
    icon: [{ url: "/images/ui-project-hub-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/images/ui-project-hub-mark.svg", type: "image/svg+xml" }],
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
