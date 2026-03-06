import { ClerkProvider, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const ogImageUrl = `${baseUrl.replace(/\/$/, "")}/api/og`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "AI市場価値鑑定 | GitHubからあなたの市場価値を可視化",
  description: "GitHubデータに基づき、エンジニアの市場価値を鑑定。推定年収・格付け・スキルレーダーを1枚の鑑定書で。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: baseUrl,
    siteName: "AI市場価値鑑定",
    images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "AI市場価値鑑定" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI市場価値鑑定 | GitHubからあなたの市場価値を可視化",
    description: "GitHubデータに基づき、エンジニアの市場価値を鑑定。推定年収・格付け・スキルレーダーを1枚の鑑定書で。",
    images: [ogImageUrl],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className="antialiased bg-[#08080a] text-zinc-100">
          <header className="sticky top-0 z-50 flex justify-end gap-3 border-b border-white/[0.06] bg-[#0a0a0f]/80 px-4 py-3 backdrop-blur-xl">
            <SignInButton mode="modal">
              <button className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.08]">
                サインイン
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100">
                新規登録
              </button>
            </SignUpButton>
            <UserButton />
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}