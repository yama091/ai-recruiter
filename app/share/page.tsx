import type { Metadata } from "next";
import ShareContent from "./ShareContent";

function parseScores(scoresParam: string | null): number[] {
  if (!scoresParam) return [70, 70, 70, 70];
  return scoresParam.split(",").map((s) => Math.min(100, Math.max(0, parseInt(s.trim(), 10) || 70)));
}

type Props = {
  searchParams: Promise<{ scores?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const scores = params.scores ?? "70,70,70,70";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const ogImageUrl = baseUrl
    ? `${baseUrl}/api/og?scores=${encodeURIComponent(scores)}`
    : `/api/og?scores=${encodeURIComponent(scores)}`;

  return {
    title: "鑑定結果サマリー | AI市場価値鑑定",
    description: "GitHubベースの市場価値診断結果。技術力・貢献度・継続力・市場性を可視化しました。",
    openGraph: {
      title: "鑑定結果サマリー | AI市場価値鑑定",
      description: "GitHubベースの市場価値診断結果。あなたも1円単位の査定を。",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "AI市場価値鑑定 鑑定結果" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "鑑定結果サマリー | AI市場価値鑑定",
      description: "GitHubベースの市場価値診断結果。",
      images: [ogImageUrl],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const scores = parseScores(params.scores ?? null);
  return <ShareContent scores={scores} />;
}
