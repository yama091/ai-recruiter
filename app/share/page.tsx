import type { Metadata } from "next";
import ShareContent from "./ShareContent";

function parseScores(scoresParam: string | null): number[] {
  if (!scoresParam) return [70, 70, 70, 70];
  return scoresParam.split(",").map((s) => Math.min(100, Math.max(0, parseInt(s.trim(), 10) || 70)));
}

type Props = {
  searchParams: Promise<{ scores?: string; title?: string; salary?: string; rank?: string; tier?: string; feedback?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const scores = params.scores ?? "70,70,70,70";
  const title = params.title ?? "";
  const salary = params.salary ?? "";
  const rank = params.rank ?? "";
  const tier = params.tier ?? "";
  const feedback = params.feedback ?? "";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const ogParams = new URLSearchParams({ scores });
  if (title) ogParams.set("title", title);
  if (salary) ogParams.set("salary", salary);
  if (rank) ogParams.set("rank", rank);
  if (tier) ogParams.set("tier", tier);
  if (feedback) ogParams.set("feedback", feedback);
  const ogImageUrl = baseUrl
    ? `${baseUrl}/api/og?${ogParams.toString()}`
    : `/api/og?${ogParams.toString()}`;

  const metaTitle = title ? `${title} | AI Market Value Certification` : "Certification Summary | AI Market Value";
  const metaDesc = title && (salary || rank)
    ? `My title: ${title}. ${salary ? `Est. ${salary}. ` : ""}${rank ? `Rank ${rank}. ` : ""}Get your GitHub-based certification.`
    : "GitHub-based market value certification. Technical, Contribution, Sustainability, Market scores.";

  return {
    title: metaTitle,
    description: metaDesc,
    openGraph: {
      title: metaTitle,
      description: metaDesc,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: "AI Market Value Certification" }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDesc,
      images: [ogImageUrl],
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
