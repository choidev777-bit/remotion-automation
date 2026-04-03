import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "YouTube 자동 생성기",
  description: "Remotion + Gemini API 기반 유튜브 영상 자동화 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
