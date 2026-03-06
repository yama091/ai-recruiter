"use client";

import { JSX, useCallback, useEffect, useRef, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { translations, getLocaleFromBrowser, type Locale } from "../lib/i18n";

const RADAR_KEYS = ["technical", "contribution", "sustainability", "market"] as const;

type RadarScores = {
  technical: number;
  contribution: number;
  sustainability: number;
  market: number;
};

function InlineBold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-white">{part}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const result: JSX.Element[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("|") && lines[i + 1]?.match(/^\|[-| ]+\|$/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        if (!lines[i].match(/^\|[-| ]+\|$/)) tableLines.push(lines[i]);
        i++;
      }
      const headers = tableLines[0].split("|").filter(Boolean).map((h) => h.trim());
      const rows = tableLines.slice(1).map((row) => row.split("|").filter(Boolean).map((c) => c.trim()));
      result.push(
        <table key={i} className="my-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, j) => (
                <th key={j} className="border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, j) => (
              <tr key={j} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                {row.map((cell, k) => (
                  <td key={k} className="border border-white/[0.04] px-4 py-2.5 text-zinc-300">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      result.push(<h3 key={i} className="mb-1 mt-5 text-base font-semibold text-zinc-200 first:mt-0">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="mb-1 mt-5 text-lg font-semibold text-white first:mt-0">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      result.push(<h1 key={i} className="mb-2 mt-5 text-xl font-bold text-white first:mt-0">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ")) {
      result.push(<li key={i} className="ml-4 list-disc text-zinc-400"><InlineBold text={line.slice(2)} /></li>);
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(<p key={i} className="leading-relaxed text-zinc-400"><InlineBold text={line} /></p>);
    }
    i++;
  }
  return <div className="space-y-0.5">{result}</div>;
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mouse-x", `${x}%`);
    el.style.setProperty("--mouse-y", `${y}%`);
  }, []);
  return (
    <div
      ref={ref}
      className={`glass-card-interactive ${className}`}
      onMouseMove={handleMouse}
    >
      {children}
    </div>
  );
}

const DEFAULT_TRANSFER_JA = "https://doda.jp/";
const DEFAULT_TRANSFER_EN = "https://www.linkedin.com/jobs/";
const DEFAULT_LEARNING_JA = "https://www.udemy.com/";
const DEFAULT_LEARNING_EN = "https://www.udemy.com/";
const DEFAULT_SIDEBIZ_JA = "https://crowdworks.jp/";
const DEFAULT_SIDEBIZ_EN = "https://www.upwork.com/";

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult] = useState("");
  const [scores, setScores] = useState<RadarScores | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [salaryDisplay, setSalaryDisplay] = useState("");
  const [rank, setRank] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLocale(getLocaleFromBrowser());
  }, []);

  const t = translations[locale];

  const analyze = async () => {
    if (!githubUrl.trim()) {
      setError(t.errorUrlRequired);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: githubUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult("");
        setScores(null);
        setJobTitle("");
        setSalaryDisplay("");
        setRank("");
        setError(data.error || t.errorAnalyzeFailed);
        return;
      }
      setResult(data.result ?? "");
      setScores(data.scores ?? null);
      setJobTitle(data.jobTitle ?? "");
      setSalaryDisplay(data.salaryDisplay ?? "");
      setRank(data.rank ?? "");
    } catch {
      setResult("");
      setScores(null);
      setJobTitle("");
      setSalaryDisplay("");
      setRank("");
      setError(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  };

  const shareText = typeof window !== "undefined" ? encodeURIComponent(t.shareTweet) : "";
  const shareUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(
          scores
            ? `${window.location.origin}/share?${new URLSearchParams({
                scores: [scores.technical, scores.contribution, scores.sustainability, scores.market].join(","),
                ...(jobTitle && { title: jobTitle }),
                ...(salaryDisplay && { salary: salaryDisplay }),
                ...(rank && { rank }),
              }).toString()}`
            : window.location.href
        )
      : "";

  const transferUrl = locale === "ja"
    ? (process.env.NEXT_PUBLIC_AFFILIATE_TRANSFER ?? DEFAULT_TRANSFER_JA)
    : (process.env.NEXT_PUBLIC_AFFILIATE_TRANSFER_EN ?? DEFAULT_TRANSFER_EN);
  const learningUrl = locale === "ja"
    ? (process.env.NEXT_PUBLIC_AFFILIATE_LEARNING ?? DEFAULT_LEARNING_JA)
    : (process.env.NEXT_PUBLIC_AFFILIATE_LEARNING_EN ?? DEFAULT_LEARNING_EN);
  const sideBizUrl = locale === "ja"
    ? (process.env.NEXT_PUBLIC_AFFILIATE_SIDEBIZ ?? DEFAULT_SIDEBIZ_JA)
    : (process.env.NEXT_PUBLIC_AFFILIATE_SIDEBIZ_EN ?? DEFAULT_SIDEBIZ_EN);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] font-sans text-zinc-100 animate-page-in">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <header className="space-y-6 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 backdrop-blur-xl"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.3) inset" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            {t.badge}
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
            {t.title}
          </h1>
          <p className="mx-auto max-w-md text-[15px] leading-[1.7] text-zinc-500 sm:text-base">
            {t.subtitle}
          </p>
        </header>

        <GlassCard className="mt-14 rounded-2xl glass-panel-strong p-6 transition-all duration-300 sm:p-8">
          <div className="flex flex-col gap-5 relative">
            <input
              type="text"
              placeholder={t.placeholder}
              className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-white/[0.12] focus:bg-white/[0.06] sm:text-base"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            {error && <p className="text-sm font-medium text-rose-400/90">{error}</p>}
            <button
              onClick={analyze}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-[15px] font-medium text-black shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.995] disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  {t.analyzing}
                </>
              ) : (
                t.analyze
              )}
            </button>
          </div>
        </GlassCard>

        {result && (
          <section className="mt-14 space-y-8">
            {jobTitle && (
              <div className="animate-fade-in-up stagger-1 rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
                <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {t.jobTitleLabel}
                </p>
                <p className="text-center text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 sm:text-3xl">
                  {jobTitle}
                </p>
                {(salaryDisplay || rank) && (
                  <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {salaryDisplay && (
                      <span className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white">
                        {salaryDisplay}
                      </span>
                    )}
                    {rank && (
                      <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-4 py-2 text-sm font-bold text-indigo-200">
                        Rank {rank}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {scores && (
              <GlassCard className="animate-fade-in-up stagger-2 rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
                <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  {t.radarTitle}
                </p>
                <h2 className="text-center text-lg font-semibold tracking-tight text-white">
                  {t.radarHeading}
                </h2>
                <div className="mx-auto mt-6 h-[280px] w-full sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={RADAR_KEYS.map((key, i) => ({
                        subject: t.radarLabels[i],
                        value: scores[key],
                        fullMark: 100,
                      }))}
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.12)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                      <Radar name={t.radarScore} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35} strokeWidth={2} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            )}

            <div className="animate-fade-in-up stagger-3 rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
              <SimpleMarkdown content={result} />
            </div>

            <GlassCard className="animate-fade-in-up stagger-4 rounded-2xl glass-panel border border-white/[0.06] p-6 sm:p-8">
              <h2 className="text-center text-lg font-semibold tracking-tight text-white">
                {t.threeStepsTitle}
              </h2>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-zinc-500">
                {t.threeStepsSubtitle}
              </p>
              <div className="mt-6 space-y-4 sm:mt-8">
                {[
                  { title: t.step1Title, desc: t.step1Desc, cta: t.ctaTransfer, href: transferUrl, bg: "rgba(99,102,241,0.2)", fg: "#a5b4fc" },
                  { title: t.step2Title, desc: t.step2Desc, cta: t.ctaLearning, href: learningUrl, bg: "rgba(16,185,129,0.2)", fg: "#6ee7b7" },
                  { title: t.step3Title, desc: t.step3Desc, cta: t.ctaSideBiz, href: sideBizUrl, bg: "rgba(245,158,11,0.2)", fg: "#fcd34d" },
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-4">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors"
                        style={{ backgroundColor: step.bg, color: step.fg }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-white">{step.title}</p>
                        <p className="mt-0.5 text-[13px] text-zinc-500">{step.desc}</p>
                      </div>
                    </div>
                    <a
                      href={step.href}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-black shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:translate-y-[-1px]"
                    >
                      {step.cta}
                    </a>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-center text-[11px] text-zinc-600">{t.affiliateNote}</p>
            </GlassCard>

            <div className="animate-fade-in-up stagger-5 space-y-4">
              <p className="text-center text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                {t.shareLabel}
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-medium text-zinc-200 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:translate-y-[-1px]"
                >
                  {t.shareX}
                </a>
                <a
                  href={locale === "ja" ? "https://doda.jp/" : "https://www.linkedin.com/jobs/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] py-3.5 text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12] hover:translate-y-[-1px]"
                >
                  {t.ctaOffer}
                </a>
              </div>
            </div>

            <div className="animate-fade-in-up stagger-6 rounded-2xl glass-panel border border-white/[0.06] p-6 sm:p-8">
              <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                {t.recommendLabel}
              </p>
              <p className="text-center text-sm text-zinc-500">{t.recommendDesc}</p>
              <div className="mt-4 flex justify-center">
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-300 hover:bg-white/[0.06]"
                >
                  {t.recommendCta}
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
