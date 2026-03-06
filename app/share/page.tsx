import type { Metadata } from "next";
import ShareContent from "./ShareContent";

function parseScores(scoresParam: string | null): number[] {
  if (!scoresParam) return [70, 70, 70, 70];
  return scoresParam.split(",").map((s) => Math.min(100, Math.max(0, parseInt(s.trim(), 10) || 70)));
}

type Props = {
  searchParams: Promise<{ scores?: string; title?: string; salary?: string; rank?: string; tier?: string; feedback?: string; mode?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const scores = params.scores ?? "70,70,70,70";
  const title = params.title ?? "";
  const salary = params.salary ?? "";
  const rank = params.rank ?? "";
  const tier = params.tier ?? "";
  const feedback = params.feedback ?? "";
  const mode = params.mode ?? "personal";
  const baseUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://ai-recruiter-4o7e.vercel.app")
  ).replace(/\/$/, "");
  const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
  const ogParams = new URLSearchParams({ scores, mode });
  if (title) ogParams.set("title", title);
  if (salary) ogParams.set("salary", salary);
  if (rank) ogParams.set("rank", rank);
  if (tier) ogParams.set("tier", tier);
  if (feedback) ogParams.set("feedback", feedback);
  const ogImageAbsoluteUrl = `${origin}/api/og?${ogParams.toString()}`;

  const metaTitle = title ? `${title} | AI市場価値鑑定` : "鑑定結果 | AI市場価値鑑定";
  const metaDesc =
    title && (salary || rank)
      ? `${title}。${salary ? `推定年収 ${salary}。` : ""}${tier || rank ? `格付け ${tier || rank}。` : ""}GitHubからあなたの市場価値を鑑定。`
      : "GitHubに基づくエンジニア市場価値鑑定。技術力・貢献度・継続力・市場性を可視化。";

  return {
    title: metaTitle,
    description: metaDesc,
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      url: `${origin}/share?${ogParams.toString()}`,
      type: "website",
      images: [{ url: ogImageAbsoluteUrl, width: 1200, height: 630, alt: "AI市場価値鑑定ポスター" }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: metaTitle,
      description: metaDesc,
      images: [ogImageAbsoluteUrl],
    },
  };
}

export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  const scores = parseScores(params.scores ?? null);
  const title = params.title ?? "";
  const salary = params.salary ?? "";
  const rank = params.rank ?? "";
  const tier = params.tier ?? "";
  const tierFeedback = params.feedback ?? "";
  return (
    <ShareContent
      scores={scores}
      jobTitle={title}
      salaryDisplay={salary}
      rank={rank}
      tier={tier}
      tierFeedback={tierFeedback}
    />
  );
}
