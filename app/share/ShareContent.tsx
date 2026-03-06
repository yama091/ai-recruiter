"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getTierConfig } from "../../lib/tiers";
import { translations, getLocaleFromBrowser, type Locale } from "../../lib/i18n";

const LABELS_EN = ["Technical", "Contribution", "Sustainability", "Market"];
const LABELS_JA = ["技術力", "貢献度", "継続力", "市場性"];
const KEYS = ["technical", "contribution", "sustainability", "market"] as const;

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

type Props = {
  scores: number[];
  jobTitle?: string;
  salaryDisplay?: string;
  rank?: string;
  tier?: string;
  tierFeedback?: string;
};

export default function ShareContent({ scores, jobTitle, salaryDisplay, rank, tier, tierFeedback }: Props) {
  const [locale, setLocale] = useState<Locale>("ja");
  useEffect(() => setLocale(getLocaleFromBrowser()), []);

  const t = translations[locale];
  const labels = locale === "ja" ? LABELS_JA : LABELS_EN;
  const data = KEYS.map((key, i) => ({
    subject: labels[i],
    value: scores[i] ?? 70,
    fullMark: 100,
  }));

  const tierCfg = tier ? getTierConfig(tier) : null;
  const tierLabel = tierCfg ? (locale === "ja" ? tierCfg.labelJa : tierCfg.labelEn) : "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080a] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />

      <div className="fixed top-4 right-4 z-50 flex items-center gap-0 rounded-xl border border-white/[0.1] bg-black/60 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setLocale("ja")}
          className={`rounded-l-xl px-3 py-2 text-xs font-semibold transition-colors ${locale === "ja" ? "bg-indigo-500/80 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          aria-label={t.langJa}
        >
          JA
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-r-xl px-3 py-2 text-xs font-semibold transition-colors ${locale === "en" ? "bg-indigo-500/80 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          aria-label={t.langEn}
        >
          EN
        </button>
      </div>

      <div className="relative z-10 mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl border-2 border-white/[0.08] bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl" style={{ boxShadow: "0 0 0 1px rgba(99,102,241,0.15), 0 32px 64px -24px rgba(0,0,0,0.5)" }}>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            AI市場価値鑑定
          </p>
          {jobTitle && (
            <p className="mt-3 text-center text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300">
              {decode(jobTitle)}
            </p>
          )}
          {tier && tierCfg && (
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <span
                className="rounded-xl px-4 py-2 text-sm font-black"
                style={{
                  background: tierCfg.gradient,
                  color: "#030303",
                  boxShadow: `0 0 16px ${tierCfg.color}50`,
                }}
              >
                {t.tierDisplay} {tier}（{tierLabel}）
              </span>
            </div>
          )}
          {(salaryDisplay || rank) && (
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {salaryDisplay && (
                <span className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white">
                  {decode(salaryDisplay)}
                </span>
              )}
              {rank && (
                <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5 text-sm font-bold text-indigo-200">
                  {t.rankLabel} {decode(rank)}
                </span>
              )}
            </div>
          )}
          {tierFeedback && (
            <p className="mt-3 text-center text-sm italic text-zinc-400">&ldquo;{decode(tierFeedback)}&rdquo;</p>
          )}
          <h1 className="mt-4 text-center text-2xl font-semibold text-white">
            {t.sharePageTitle}
          </h1>
          <div className="mx-auto mt-8 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                <Radar name={t.radarScore} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            {t.sharePageCta}
          </p>
          <a
            href="/"
            className="mt-4 block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-black transition hover:bg-zinc-100"
          >
            {t.sharePageBack}
          </a>
        </div>
      </div>
    </main>
  );
}
