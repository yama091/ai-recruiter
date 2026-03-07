"use client";

import Link from "next/link";
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
import { translations, getLocaleFromBrowser, type Locale, type AppMode } from "../lib/i18n";
import { getTierConfig } from "../lib/tiers";

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
      result.push(<h3 key={i} className="mb-1 mt-5 text-base font-semibold text-zinc-100 first:mt-0">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      result.push(<h2 key={i} className="mb-1 mt-5 text-lg font-semibold text-white first:mt-0">{line.slice(3)}</h2>);
    } else if (line.startsWith("# ")) {
      result.push(<h1 key={i} className="mb-2 mt-5 text-xl font-bold text-white first:mt-0">{line.slice(2)}</h1>);
    } else if (line.startsWith("- ")) {
      result.push(<li key={i} className="ml-4 list-disc text-zinc-200"><InlineBold text={line.slice(2)} /></li>);
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(<p key={i} className="leading-relaxed text-zinc-200"><InlineBold text={line} /></p>);
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
  const [locale, setLocale] = useState<Locale>("ja");
  const [mode, setMode] = useState<AppMode>("personal");
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult] = useState("");
  const [scores, setScores] = useState<RadarScores | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [salaryDisplay, setSalaryDisplay] = useState("");
  const [rank, setRank] = useState("");
  const [tier, setTier] = useState("");
  const [tierFeedback, setTierFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactOpen, setContactOpen] = useState(false);

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
        body: JSON.stringify({
          githubUrl: githubUrl.trim(),
          locale,
          language: locale,
          mode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult("");
        setScores(null);
        setJobTitle("");
        setSalaryDisplay("");
        setRank("");
        setTier("");
        setTierFeedback("");
        setError(data.error || t.errorAnalyzeFailed);
        return;
      }
      setResult(data.result ?? "");
      setScores(data.scores ?? null);
      setJobTitle(data.jobTitle ?? "");
      setSalaryDisplay(data.salaryDisplay ?? "");
      setRank(data.rank ?? "");
      setTier(data.tier ?? "");
      setTierFeedback(data.tierFeedback ?? "");
    } catch {
      setResult("");
      setScores(null);
      setJobTitle("");
      setSalaryDisplay("");
      setRank("");
      setTier("");
      setTierFeedback("");
      setError(t.errorNetwork);
    } finally {
      setLoading(false);
    }
  };

  const transferUrl = locale === "ja"
    ? (process.env.NEXT_PUBLIC_AFFILIATE_TRANSFER ?? DEFAULT_TRANSFER_JA)
    : (process.env.NEXT_PUBLIC_AFFILIATE_TRANSFER_EN ?? DEFAULT_TRANSFER_EN);
  const learningUrl = locale === "ja"
    ? (process.env.NEXT_PUBLIC_AFFILIATE_LEARNING ?? DEFAULT_LEARNING_JA)
    : (process.env.NEXT_PUBLIC_AFFILIATE_LEARNING_EN ?? DEFAULT_LEARNING_EN);
  const sideBizUrl = locale === "ja"
    ? (process.env.NEXT_PUBLIC_AFFILIATE_SIDEBIZ ?? DEFAULT_SIDEBIZ_JA)
    : (process.env.NEXT_PUBLIC_AFFILIATE_SIDEBIZ_EN ?? DEFAULT_SIDEBIZ_EN);

  const tierCfg = tier ? getTierConfig(tier) : null;
  const tierLabel = tierCfg ? (locale === "ja" ? tierCfg.labelJa : tierCfg.labelEn) : "";

  const reportRef = useRef<HTMLElement>(null);

  const handleShareOnX = useCallback(() => {
    if (typeof window === "undefined") return;
    const appUrl = scores
      ? `${window.location.origin}/share?${new URLSearchParams({
          scores: [scores.technical, scores.contribution, scores.sustainability, scores.market].join(","),
          ...(jobTitle && { title: jobTitle }),
          ...(salaryDisplay && { salary: salaryDisplay }),
          ...(rank && { rank }),
          ...(tier && { tier }),
          ...(tierFeedback && { feedback: tierFeedback }),
          mode,
          v: "final",
        }).toString()}`
      : window.location.href;
    const tierCfg = tier ? getTierConfig(tier) : null;
    const rankName = tierCfg ? (locale === "ja" ? tierCfg.labelJa : tierCfg.labelEn) : (tier || rank || "—");
    const shareText =
      locale === "ja"
        ? `【AI市場価値鑑定】私の市場価値を可視化しました！判定は「${rankName}」です。 #AI鑑定 #エンジニア市場価値`
        : `Got my engineer market value certified by AI! My tier: ${rankName} #AICertification #EngineerSalary`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer");
  }, [scores, jobTitle, salaryDisplay, rank, tier, tierFeedback, locale]);

  const handlePdfExport = useCallback(() => {
    if (typeof window === "undefined" || !reportRef.current) return;
    const prevTitle = document.title;
    document.title = mode === "business" ? (locale === "ja" ? "エンジニアスキルレポート" : "Engineer Skill Report") : (locale === "ja" ? "AI市場価値鑑定" : "AI Market Value Certification");
    window.print();
    document.title = prevTitle;
  }, [mode, locale]);

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#08080a] font-sans text-zinc-100 animate-page-in"
      data-theme={mode}
    >
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />
      <div className="meteors-layer" aria-hidden>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="meteor" />
        ))}
      </div>
      {loading && (
        <div className="scan-overlay" aria-hidden>
          <div className="absolute inset-0 bg-[#030303]/20" />
        </div>
      )}

      <div className="fixed top-14 right-4 z-50 flex items-center gap-2">
        <div className="mode-tabs">
          <button
            type="button"
            onClick={() => setMode("personal")}
            data-active={mode === "personal"}
            aria-label={t.modePersonal}
          >
            {t.modePersonal}
          </button>
          <button
            type="button"
            onClick={() => setMode("business")}
            data-active={mode === "business"}
            aria-label={t.modeBusiness}
          >
            {t.modeBusiness}
          </button>
        </div>
        <div className="flex items-center gap-0 rounded-xl border border-white/[0.1] bg-black/60 backdrop-blur-xl">
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
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-16 sm:py-24">
        <header className="space-y-6 text-center break-words">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 backdrop-blur-xl"
            style={{
              boxShadow: mode === "business" ? "0 0 0 1px rgba(29,78,216,0.2) inset" : "0 0 0 1px rgba(0,0,0,0.3) inset",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: mode === "business" ? "#1e40af" : "#8b5cf6",
                boxShadow: mode === "business" ? "0 0 12px rgba(30,64,175,0.7)" : "0 0 12px rgba(139,92,246,0.7)",
                ...(mode === "personal" && { backgroundColor: "#8b5cf6" }),
              }}
            />
            {mode === "personal" ? t.badge : t.businessBadge}
          </div>
          <h1
            className={`font-semibold tracking-[-0.02em] text-white break-words ${mode === "personal" ? "text-2xl sm:text-4xl md:text-5xl" : "text-xl sm:text-3xl md:text-4xl"}`}
            style={mode === "business" ? { textWrap: "balance" } : undefined}
          >
            {mode === "personal" ? (
              t.title
            ) : (
              <>
                {t.businessTitle1}
                <br className="block sm:hidden" />
                {t.businessTitle2}
              </>
            )}
          </h1>
          <p
            className={`mx-auto max-w-md break-words text-zinc-200 ${mode === "personal" ? "text-sm leading-[1.7] sm:text-base" : "text-sm leading-[1.6] sm:text-base"}`}
            style={mode === "business" ? { textWrap: "balance" } : undefined}
          >
            {mode === "personal" ? t.subtitle : t.businessSubtitle}
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
          <section ref={reportRef} data-print-report className="mt-14 space-y-8">
            <div className="space-y-8">
            {mode === "business" && jobTitle && (
              <GlassCard className="animate-fade-in-up stagger-1 card-gradient-border rounded-2xl overflow-hidden">
                <div className="rounded-2xl glass-panel-strong p-6 sm:p-8">
                  <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {t.businessReportSummary}
                  </p>
                  <p className="text-center text-xl font-bold tracking-tight text-white sm:text-2xl">
                    {jobTitle}
                  </p>
                  {salaryDisplay && (
                    <p className="mt-3 text-center text-lg font-semibold text-zinc-300">
                      {t.businessReportMarketValue}: {salaryDisplay}
                    </p>
                  )}
                </div>
              </GlassCard>
            )}

            {mode === "personal" && jobTitle && (
              <GlassCard className="animate-fade-in-up stagger-1 card-gradient-border rounded-2xl overflow-hidden">
                <div className="rounded-2xl glass-panel-strong p-6 sm:p-8">
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
                          {t.rankLabel} {rank}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            {mode === "personal" && tier && tierCfg && (
              <GlassCard className="animate-fade-in-up stagger-2 card-gradient-border rounded-2xl overflow-hidden">
                <div className="rounded-2xl glass-panel-strong p-6 sm:p-8">
                  <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {t.tierBadge}
                  </p>
                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
                    <div
                      className="flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-black"
                      style={{
                        background: tierCfg.gradient,
                        color: "#030303",
                        boxShadow: `0 0 24px ${tierCfg.color}40`,
                      }}
                    >
                      <span className="opacity-90">{tierCfg.badgeSymbol}</span>
                      <span>{t.tierDisplay} {tier}</span>
                      <span className="text-sm font-bold opacity-90">（{tierLabel}）</span>
                    </div>
                  </div>
                  {tierFeedback && (
                    <p className="mt-4 text-center text-sm italic leading-relaxed text-zinc-200">
                      &ldquo;{tierFeedback}&rdquo;
                    </p>
                  )}
                </div>
              </GlassCard>
            )}

            {scores && (
              <GlassCard className="animate-fade-in-up stagger-3 card-gradient-border rounded-2xl overflow-hidden">
                <div className="rounded-2xl glass-panel-strong p-6 sm:p-8">
                  <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {mode === "business" ? t.businessRadarTitle : t.radarTitle}
                  </p>
                  <h2 className="text-center text-lg font-semibold tracking-tight text-white">
                    {mode === "business" ? t.businessRadarHeading : t.radarHeading}
                  </h2>
                  <div className="print-radar-bg mx-auto mt-6 h-[280px] w-full sm:h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        data={RADAR_KEYS.map((key, i) => ({
                          subject: mode === "business" ? t.businessRadarLabels[i] : t.radarLabels[i],
                          value: scores[key],
                          fullMark: 100,
                        }))}
                      >
                        <PolarGrid stroke="rgba(255,255,255,0.12)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                        <Radar name={t.radarScore} dataKey="value" stroke={mode === "business" ? "#1e40af" : "#8b5cf6"} fill={mode === "business" ? "#2563eb" : "#a78bfa"} fillOpacity={0.35} strokeWidth={2} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  {mode === "business" && (
                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {[scores.technical, scores.contribution, scores.sustainability, scores.market].map((val, i) => (
                        <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{t.businessRadarLabels[i]}</p>
                          <p className="mt-1 text-2xl font-bold text-white">{val}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            )}

            <GlassCard className="animate-fade-in-up stagger-4 card-gradient-border rounded-2xl overflow-hidden">
              <div className="rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
              <SimpleMarkdown content={result} />
              </div>
            </GlassCard>
            </div>

            {mode === "personal" && (
            <div className="animate-fade-in-up stagger-4b space-y-4">
              <p className="text-center text-sm font-semibold text-zinc-300">
                {t.nextActionTitle}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <a
                  href={transferUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="golden-vip-button flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-6 py-5 text-center transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] sm:min-h-[64px] sm:py-6"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100">
                    {t.vipCtaTransfer}
                  </span>
                  <span className="text-base font-bold text-white drop-shadow-sm sm:text-lg">
                    {locale === "ja" ? "doda・転職サイト →" : "LinkedIn / Job Boards →"}
                  </span>
                </a>
                <a
                  href={learningUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="golden-vip-button flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-6 py-5 text-center transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] sm:min-h-[64px] sm:py-6"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-100">
                    {t.vipCtaLearning}
                  </span>
                  <span className="text-base font-bold text-white drop-shadow-sm sm:text-lg">
                    {locale === "ja" ? "Udemy・スクール →" : "Udemy / Courses →"}
                  </span>
                </a>
              </div>
            </div>
            )}

            {mode === "business" && (
            <div className="animate-fade-in-up stagger-4b flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handlePdfExport}
                className="rounded-xl border border-white/[0.12] bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/[0.1] hover:border-white/[0.18]"
              >
                {t.pdfExport}
              </button>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="rounded-xl border border-[#2563eb]/50 bg-[#2563eb]/20 px-6 py-3.5 text-center text-sm font-semibold text-blue-200 transition-all hover:bg-[#2563eb]/30"
              >
                {t.contactEnterprise}
              </button>
            </div>
            )}

            {contactOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setContactOpen(false)} aria-hidden />
                <div className="relative w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0f0f12] p-6 shadow-2xl">
                  <h2 id="contact-modal-title" className="text-lg font-semibold text-white">{t.contactModalTitle}</h2>
                  <p className="mt-2 text-sm text-zinc-400">{t.contactModalDesc}</p>
                  <div className="mt-6 space-y-3">
                    <Link
                      href="/contact"
                      className="block rounded-xl border border-indigo-500/30 bg-indigo-500/20 px-4 py-3 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/30"
                    >
                      {t.contactFormPage}
                    </Link>
                    {(process.env.NEXT_PUBLIC_CONTACT_FORM_URL || process.env.NEXT_PUBLIC_CONTACT_GOOGLE_FORM) && (
                      <a
                        href={process.env.NEXT_PUBLIC_CONTACT_FORM_URL || process.env.NEXT_PUBLIC_CONTACT_GOOGLE_FORM}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                      >
                        {t.contactForm}
                      </a>
                    )}
                    {(process.env.NEXT_PUBLIC_CONTACT_X_DM || process.env.NEXT_PUBLIC_CONTACT_TWITTER) && (
                      <a
                        href={process.env.NEXT_PUBLIC_CONTACT_X_DM || process.env.NEXT_PUBLIC_CONTACT_TWITTER}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                      >
                        {t.contactX}
                      </a>
                    )}
                    {(() => {
                    const emailOrEnterprise = process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.NEXT_PUBLIC_CONTACT_ENTERPRISE;
                    const mailtoHref = emailOrEnterprise
                      ? (String(emailOrEnterprise).startsWith("mailto:") ? String(emailOrEnterprise) : `mailto:${emailOrEnterprise}`)
                      : "mailto:info@example.com?subject=大規模利用・API連携のご相談";
                    return (
                      <a
                        href={mailtoHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm font-medium text-white transition hover:bg-white/[0.08]"
                      >
                        {t.contactEmail}
                      </a>
                    );
                  })()}
                  </div>
                  <button
                    type="button"
                    onClick={() => setContactOpen(false)}
                    className="mt-6 w-full rounded-xl bg-white/10 py-2.5 text-sm font-medium text-white hover:bg-white/15"
                  >
                    {t.contactClose}
                  </button>
                </div>
              </div>
            )}

            {mode === "personal" && (
            <GlassCard className="animate-fade-in-up stagger-5 card-gradient-border rounded-2xl overflow-hidden">
              <div className="rounded-2xl glass-panel border border-white/[0.06] p-6 sm:p-8">
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
              </div>
            </GlassCard>
            )}

            {mode === "personal" && (
            <div className="animate-fade-in-up stagger-6 space-y-4">
              <p className="text-center text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                {t.shareLabel}
              </p>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleShareOnX}
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-8 py-3.5 text-sm font-medium text-amber-200 backdrop-blur-xl transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-500/50 hover:translate-y-[-1px]"
                >
                  {t.saveImageAndShare}
                </button>
              </div>
            </div>
            )}

            {mode === "personal" && (
            <div className="animate-fade-in-up stagger-7 rounded-2xl glass-panel border border-white/[0.06] p-6 sm:p-8">
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
            )}
          </section>
        )}
      </div>
    </main>
  );
}
