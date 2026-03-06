import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import HeaderButtons from "./HeaderButtons";

// Xカード: 超・強制設定（環境変数なし・フルURL・キャッシュバイパス ?v=final）
const OGP_IMAGE_URL = "https://ai-recruiter-4o7e.vercel.app/api/og?v=final";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-recruiter-4o7e.vercel.app"),
  title: "AI市場価値鑑定 | GitHubからあなたの市場価値を可視化",
  description: "GitHubデータに基づき、エンジニアの市場価値を鑑定。推定年収・格付け・スキルレーダーを1枚の鑑定書で。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://ai-recruiter-4o7e.vercel.app",
    siteName: "AI市場価値鑑定",
    images: [OGP_IMAGE_URL],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "AI市場価値鑑定 | GitHubからあなたの市場価値を可視化",
    description: "GitHubデータに基づき、エンジニアの市場価値を鑑定。推定年収・格付け・スキルレーダーを1枚の鑑定書で。",
    images: ["https://ai-recruiter-4o7e.vercel.app/api/og?v=final"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="antialiased bg-[#08080a] text-zinc-100">
          <header className="sticky top-0 z-50 flex justify-end border-b border-white/[0.06] bg-[#0a0a0f]/80 px-4 py-3 backdrop-blur-xl">
            <HeaderButtons />
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}