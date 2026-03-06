"use client";

import { JSX, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RADAR_LABELS = ["技術力", "貢献度", "継続力", "市場性"];
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
      const rows = tableLines
        .slice(1)
        .map((row) => row.split("|").filter(Boolean).map((c) => c.trim()));
      result.push(
        <table key={i} className="my-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, j) => (
                <th
                  key={j}
                  className="border border-white/[0.06] bg-white/[0.04] px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-zinc-400"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, j) => (
              <tr
                key={j}
                className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
              >
                {row.map((cell, k) => (
                  <td
                    key={k}
                    className="border border-white/[0.04] px-4 py-2.5 text-zinc-300"
                  >
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
      result.push(
        <h3 key={i} className="mb-1 mt-5 text-base font-semibold text-zinc-200 first:mt-0">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      result.push(
        <h2 key={i} className="mb-1 mt-5 text-lg font-semibold text-white first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      result.push(
        <h1 key={i} className="mb-2 mt-5 text-xl font-bold text-white first:mt-0">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ")) {
      result.push(
        <li key={i} className="ml-4 list-disc text-zinc-400">
          <InlineBold text={line.slice(2)} />
        </li>
      );
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(
        <p key={i} className="leading-relaxed text-zinc-400">
          <InlineBold text={line} />
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{result}</div>;
}

export default function Home() {
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult] = useState("");
  const [scores, setScores] = useState<RadarScores | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!githubUrl.trim()) {
      setError("GitHubのURLを入力してください");
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
        setError(data.error || "鑑定に失敗しました");
        return;
      }
      setResult(data.result ?? "");
      setScores(data.scores ?? null);
    } catch {
      setResult("");
      setScores(null);
      setError("通信エラーが発生しました。しばらくしてからお試しください。");
    } finally {
      setLoading(false);
    }
  };

  const shareText =
    typeof window !== "undefined"
      ? encodeURIComponent(
          `【AI市場価値鑑定】私の推定年収を査定してもらいました\n#AI査定 #エンジニア転職\n`
        )
      : "";
  const shareUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(
          scores
            ? `${window.location.origin}/share?scores=${[scores.technical, scores.contribution, scores.sustainability, scores.market].join(",")}`
            : window.location.href
        )
      : "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080a] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <header className="space-y-6 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500 backdrop-blur-xl"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.25) inset" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
            High-End Engineer Valuation
          </div>
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl">
            AI市場価値鑑定
          </h1>
          <p className="mx-auto max-w-md text-[15px] leading-[1.7] text-zinc-500 sm:text-base">
            GitHubからあなたの真の価値を1円単位で算出。データに基づく鑑定書を発行します。
          </p>
        </header>

        <section
          className="mt-14 rounded-2xl glass-panel-strong p-6 transition-all duration-300 sm:p-8"
          style={{ animation: "none" }}
        >
          <div className="flex flex-col gap-5">
            <input
              type="text"
              placeholder="https://github.com/username"
              className="input-premium w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none transition-all duration-300 placeholder:text-zinc-600 focus:border-white/[0.12] focus:bg-white/[0.06] sm:text-base"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            {error && (
              <p className="text-sm font-medium text-rose-400/90">{error}</p>
            )}
            <button
              onClick={analyze}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-[15px] font-medium text-black shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:translate-y-[-1px] active:translate-y-0 active:scale-[0.995] disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  鑑定中...
                </>
              ) : (
                "精密査定を実行する"
              )}
            </button>
          </div>
        </section>

        {result && (
          <section className="mt-14 space-y-8">
            {scores && (
              <div className="animate-fade-in-up stagger-1 rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
                <p className="mb-4 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                  強みがひと目でわかる
                </p>
                <h2 className="text-center text-lg font-semibold tracking-tight text-white">
                  鑑定レーダー
                </h2>
                <div className="mx-auto mt-6 h-[280px] w-full sm:h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={RADAR_KEYS.map((key, i) => ({
                        subject: RADAR_LABELS[i],
                        value: scores[key],
                        fullMark: 100,
                      }))}
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.12)" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#a1a1aa", fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: "#71717a", fontSize: 10 }}
                      />
                      <Radar
                        name="スコア"
                        dataKey="value"
                        stroke="#6366f1"
                        fill="#6366f1"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="animate-fade-in-up stagger-2 rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
              <SimpleMarkdown content={result} />
            </div>

            {/* 年収を100万円上げるための3ステップ + アフィリエイト導線 */}
            <div className="animate-fade-in-up stagger-3 rounded-2xl glass-panel border border-white/[0.06] p-6 sm:p-8">
              <h2 className="text-center text-lg font-semibold tracking-tight text-white">
                あなたの年収を100万円上げるための具体的な3つのステップ
              </h2>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-zinc-500">
                鑑定結果を踏まえ、次のアクションで市場価値を確実に高めます。
              </p>
              <div className="mt-6 space-y-4 sm:mt-8">
                <div className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-sm font-bold text-indigo-300 transition-colors group-hover:bg-indigo-500/25">1</span>
                    <div>
                      <p className="font-medium text-white">市場価値を転職市場で試す</p>
                      <p className="mt-0.5 text-[13px] text-zinc-500">今のスキルがどのレンジで評価されるか、面接とオファーで確かめましょう。</p>
                    </div>
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_AFFILIATE_TRANSFER ?? "https://doda.jp/"}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-black shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:translate-y-[-1px]"
                  >
                    転職サービスを比較する →
                  </a>
                </div>
                <div className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-sm font-bold text-emerald-300 transition-colors group-hover:bg-emerald-500/25">2</span>
                    <div>
                      <p className="font-medium text-white">不足スキルを体系的に習得する</p>
                      <p className="mt-0.5 text-[13px] text-zinc-500">鑑定で挙がった「習得すべき技術」を、実践的な教材で短期集中でカバー。</p>
                    </div>
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_AFFILIATE_LEARNING ?? "https://www.udemy.com/"}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-black shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:translate-y-[-1px]"
                  >
                    学習教材を探す →
                  </a>
                </div>
                <div className="group flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:translate-y-[-2px] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-bold text-amber-300 transition-colors group-hover:bg-amber-500/25">3</span>
                    <div>
                      <p className="font-medium text-white">副業で実績と交渉材料を作る</p>
                      <p className="mt-0.5 text-[13px] text-zinc-500">本業以外の実績は、年収交渉や転職時の「証拠」として強く効きます。</p>
                    </div>
                  </div>
                  <a
                    href={process.env.NEXT_PUBLIC_AFFILIATE_SIDEBIZ ?? "https://crowdworks.jp/"}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-[13px] font-medium text-black shadow-[0_2px_12px_rgba(0,0,0,0.2)] transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:translate-y-[-1px]"
                  >
                    副業・案件を探す →
                  </a>
                </div>
              </div>
              <p className="mt-5 text-center text-[11px] text-zinc-600">
                上記リンクは提携サービスです。利用規約に同意のうえご利用ください。
              </p>
            </div>

            <div className="animate-fade-in-up stagger-4 space-y-4">
              <p className="text-center text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                鑑定結果をシェア
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-medium text-zinc-200 backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.06] hover:border-white/[0.12] hover:translate-y-[-1px]"
                >
                  𝕏 で結果をシェア
                </a>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] py-3.5 text-sm font-medium text-white backdrop-blur-xl transition-all duration-300 hover:bg-white/[0.08] hover:border-white/[0.12] hover:translate-y-[-1px]"
                >
                  年収UPのオファーを受ける
                </a>
              </div>
            </div>

            <div className="animate-fade-in-up stagger-5 rounded-2xl glass-panel border border-white/[0.06] p-6 sm:p-8">
              <p className="mb-1 text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                おすすめキャリア枠
              </p>
              <p className="text-center text-sm text-zinc-500">
                年収1,000万超えを目指すエンジニア向けの転職・副業サービスを厳選（準備中）
              </p>
              <div className="mt-4 flex justify-center">
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:bg-white/[0.06]"
                >
                  おすすめサービスを見る →
                </a>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
