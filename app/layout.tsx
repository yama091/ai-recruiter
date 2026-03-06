import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import HeaderButtons from "./HeaderButtons";

// OGP/Xカード用: NEXT_PUBLIC_APP_URL を最優先し、必ず絶対URLで配信
const baseUrl = (() => {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const clean = String(url).replace(/\/$/, "");
  return clean.startsWith("http") ? clean : `https://${clean}`;
})();
const ogImageAbsoluteUrl = `${baseUrl}/api/og`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "AI市場価値鑑定 | GitHubからあなたの市場価値を可視化",
  description: "GitHubデータに基づき、エンジニアの市場価値を鑑定。推定年収・格付け・スキルレーダーを1枚の鑑定書で。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: baseUrl,
    siteName: "AI市場価値鑑定",
    images: [{ url: ogImageAbsoluteUrl, width: 1200, height: 630, alt: "AI市場価値鑑定" }],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "AI市場価値鑑定 | GitHubからあなたの市場価値を可視化",
    description: "GitHubデータに基づき、エンジニアの市場価値を鑑定。推定年収・格付け・スキルレーダーを1枚の鑑定書で。",
    images: [ogImageAbsoluteUrl],
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