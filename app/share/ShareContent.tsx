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

const LABELS = ["Technical", "Contribution", "Sustainability", "Market"];
const KEYS = ["technical", "contribution", "sustainability", "market"] as const;

type Props = {
  scores: number[];
  jobTitle?: string;
  salaryDisplay?: string;
  rank?: string;
};

export default function ShareContent({ scores, jobTitle, salaryDisplay, rank }: Props) {
  const data = KEYS.map((key, i) => ({
    subject: LABELS[i],
    value: scores[i] ?? 70,
    fullMark: 100,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030303] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />
      <div className="relative mx-auto max-w-lg px-4 py-20">
        <div className="rounded-2xl glass-panel-strong p-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-zinc-500">
            AI Market Value Certification
          </p>
          {jobTitle && (
            <p className="mt-3 text-center text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300">
              {decodeURIComponent(jobTitle)}
            </p>
          )}
          {(salaryDisplay || rank) && (
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {salaryDisplay && (
                <span className="rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-sm font-semibold text-white">
                  {decodeURIComponent(salaryDisplay)}
                </span>
              )}
              {rank && (
                <span className="rounded-lg border border-indigo-500/30 bg-indigo-500/20 px-3 py-1.5 text-sm font-bold text-indigo-200">
                  Rank {decodeURIComponent(rank)}
                </span>
              )}
            </div>
          )}
          <h1 className="mt-4 text-center text-2xl font-semibold text-white">
            Certification Summary
          </h1>
          <div className="mx-auto mt-8 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 10 }} />
                <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            Get your GitHub-based market value certified →
          </p>
          <a
            href="/"
            className="mt-4 block w-full rounded-xl bg-white py-3 text-center text-sm font-medium text-black transition hover:bg-zinc-100"
          >
            Back to certification
          </a>
        </div>
      </div>
    </main>
  );
}
