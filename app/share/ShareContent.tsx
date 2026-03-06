"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

const LABELS = ["技術力", "貢献度", "継続力", "市場性"];
const KEYS = ["technical", "contribution", "sustainability", "market"] as const;

export default function ShareContent({ scores }: { scores: number[] }) {
  const data = KEYS.map((key, i) => ({
    subject: LABELS[i],
    value: scores[i] ?? 70,
    fullMark: 100,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080a] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />
      <div className="relative mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl glass-panel-strong p-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
            AI市場価値鑑定
          </p>
          <h1 className="mt-2 text-center text-2xl font-semibold text-white">
            鑑定結果サマリー
          </h1>
          <div className="mx-auto mt-8 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
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
                  fillOpacity={0.4}
                  strokeWidth={2}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            あなたもGitHubから1円単位の市場価値を診断 →
          </p>
          <a
            href="/"
            className="mt-4 block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-black transition hover:bg-zinc-100"
          >
            トップで鑑定する
          </a>
        </div>
      </div>
    </main>
  );
}
