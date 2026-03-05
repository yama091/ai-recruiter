"use client";

import { useCallback, useState } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";

const initialProfile = {
  githubUrl: "https://github.com/example/awesome-engineer",
  technologies: ["TypeScript", "Next.js", "React", "Node.js", "GraphQL", "AWS"],
  salaryRange: "900〜1,100万円",
  motivationScore: 8.4,
  motivationText: "高い（直近6ヶ月で活発にOSS活動・個人開発を継続）",
};

const initialScoutText = `〇〇様

この度は、GitHubでのご活動内容を拝見し、ご連絡させていただきました。
貴殿の継続的なアウトプットとモダンな技術スタックに深く感銘を受けております。

弊社では、プロダクト主導で自律的に開発を推進できるエンジニアの方を探しており、
まさに〇〇様のご経験・スタイルがフィットすると感じております。

ぜひ一度、カジュアルにお話できる機会を頂戴できませんでしょうか。`;

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  accent?: "blue" | "violet" | "emerald";
};

const StatCard = ({
  title,
  value,
  description,
  accent = "blue",
}: StatCardProps) => {
  const accentClass =
    accent === "violet"
      ? "from-violet-500/40 to-fuchsia-500/10 border-violet-400/60 shadow-violet-500/40"
      : accent === "emerald"
      ? "from-emerald-400/40 to-cyan-400/10 border-emerald-400/60 shadow-emerald-500/40"
      : "from-sky-500/40 to-indigo-500/10 border-sky-400/60 shadow-sky-500/40";

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br p-[1px] shadow-[0_18px_60px_rgba(15,23,42,0.9)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),transparent_60%)] opacity-80" />
      <div
        className={`relative h-full rounded-[22px] border bg-slate-950/70 px-5 py-4 backdrop-blur-xl ${accentClass}`}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400/90">
            {title}
          </span>
          <p className="text-[22px] font-semibold text-slate-50 tracking-tight">
            {value}
          </p>
          <p className="text-xs text-slate-400/90">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { isSignedIn } = useAuth(); // ログイン状態をチェック
  const [githubUrl, setGithubUrl] = useState(initialProfile.githubUrl);
  const [profile, setProfile] = useState(initialProfile);
  const [scoutText, setScoutText] = useState(initialScoutText);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromAI, setIsFromAI] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAnalyze = useCallback(async () => {
    const trimmed = githubUrl.trim();
    if (!trimmed) {
      return;
    }
    setIsLoading(true);
    setCopied(false);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: trimmed }),
      });
      if (!res.ok) {
        // モックAPIのため、ここには通常入らない想定
        return;
      }
      const data = await res.json();
      setProfile({
        githubUrl: trimmed,
        technologies: data.technologies ?? [],
        salaryRange: data.salaryRange ?? "解析不能",
        motivationScore: data.motivationScore ?? 0,
        motivationText: data.motivationText ?? "",
      });
      setScoutText(data.scoutText || "");
      setIsFromAI(true);
    } catch (e) {
      // モック運用ではエラー表示は行わない
    } finally {
      setIsLoading(false);
    }
  }, [githubUrl]);

  const handleCopy = useCallback(() => {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(scoutText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [scoutText]);

  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100">
      {/* 背景のラグジュアリーなグラデーションレイヤー */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_55%),radial-gradient(circle_at_left,_rgba(168,85,247,0.14),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,1),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,_rgba(15,23,42,0.4),rgba(2,6,23,0.95))]" />
      </div>

      {/* Sidebar */}
      <aside className="hidden border-r border-slate-800/60 bg-slate-950/60 px-6 py-8 backdrop-blur-2xl md:flex md:w-72">
        <div className="flex w-full flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-xs font-bold tracking-widest text-slate-950 shadow-[0_12px_40px_rgba(56,189,248,0.7)]">
                AI
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-[0.24em] text-slate-400 uppercase">
                  Recruiter
                </span>
                <span className="text-sm text-slate-300">
                  Talent Intelligence Suite
                </span>
              </div>
            </div>

            <nav className="flex flex-col gap-2 text-sm">
              <button className="flex items-center justify-between rounded-2xl bg-slate-900/70 px-4 py-2.5 text-left text-sky-100 shadow-[0_10px_30px_rgba(15,23,42,0.9)]">
                <span className="text-xs font-medium tracking-wide">
                  ダッシュボード
                </span>
                <span className="rounded-full bg-sky-500/20 px-2 py-[2px] text-[10px] font-semibold text-sky-300">
                  LIVE
                </span>
              </button>
            </nav>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 text-[11px] text-slate-400 shadow-[0_14px_40px_rgba(15,23,42,0.9)]">
            <p className="mb-1.5 font-medium text-slate-200">
              エンジニアの技術資産と貢献度をAIが多角的に分析。
            </p>
            <p>
              GitHub上の活動履歴から、技術スタック・関与度・アウトプット傾向を定量化し、採用やアサイン判断を下支えするインサイトを提供します。
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 md:p-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-8">
          {/* 入力＋アクションエリア */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/70 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-2xl sm:p-8">
            <div className="pointer-events-none absolute inset-x-10 -top-24 h-40 rounded-full bg-gradient-to-r from-sky-500/25 via-emerald-400/15 to-fuchsia-500/25 blur-3xl" />

            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-[5px] text-[11px] font-medium text-sky-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.4)]" />
                  GitHub リンクから、技術資産を即時スコアリング
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-50 sm:text-[28px]">
                  エンジニアの技術資産と貢献度を{" "}
                  <span className="bg-gradient-to-r from-sky-300 via-emerald-300 to-fuchsia-300 bg-clip-text text-transparent">
                    AIが多角的に分析
                  </span>
                </h1>
                <p className="text-sm text-slate-400 sm:text-[13px]">
                  GitHubのアクティビティから技術スタック、貢献度、関与スタイルを抽出し、採用・タレントプール運用の意思決定を支える指標として提示します。
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-medium text-slate-300">
                  GitHub プロフィールまたはリポジトリの URL
                </label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="https://github.com/..."
                  />

                  {/* ログイン状態によるボタンの切り替え */}
                  {!isSignedIn ? (
                    <SignInButton mode="modal">
                      <button className="w-full whitespace-nowrap rounded-2xl bg-gradient-to-r from-slate-100 to-slate-300 px-5 py-3 text-xs font-semibold text-slate-900 shadow-[0_14px_40px_rgba(148,163,184,0.6)] transition hover:translate-y-[1px] hover:shadow-[0_10px_30px_rgba(148,163,184,0.7)] sm:w-auto">
                        ログインして分析する
                      </button>
                    </SignInButton>
                  ) : (
                    <button
                      onClick={handleAnalyze}
                      disabled={isLoading}
                      className="group flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-sky-400 via-emerald-400 to-fuchsia-400 px-5 py-3 text-xs font-semibold text-slate-950 shadow-[0_18px_55px_rgba(56,189,248,0.7)] transition hover:translate-y-[1px] hover:shadow-[0_12px_40px_rgba(56,189,248,0.8)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {isLoading && (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-[2px] border-slate-900/70 border-t-transparent" />
                      )}
                      {isLoading ? "AI分析中..." : "AIで分析する"}
                    </button>
                  )}
                </div>

                {isFromAI && (
                  <p className="text-[11px] text-emerald-300/90">
                    最新の分析結果を反映しました。スカウト文は画面下部からコピーできます。
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* スコアカード */}
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard
              title="技術スタック・専門領域"
              value={profile.technologies.slice(0, 3).join(" / ")}
              description="中長期的に扱ってきたコア技術領域を集約"
            />
            <StatCard
              title="市場レンジの目安"
              value={profile.salaryRange}
              description="市場価値に基づいた適正レンジの目安を算出"
              accent="emerald"
            />
            <StatCard
              title="コミットメント指標"
              value={`${profile.motivationScore.toFixed(1)}/10`}
              description={
                profile.motivationText ||
                "リポジトリの活動密度や更新リズムから総合的に推定"
              }
              accent="violet"
            />
          </section>

          {/* スカウト文エリア */}
          <section className="relative mt-2 overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/80 shadow-[0_22px_70px_rgba(15,23,42,0.95)] backdrop-blur-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),transparent_55%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.2),transparent_55%)] opacity-70" />
            <div className="relative flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-300 uppercase">
                    AI スカウトテンプレート
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-50">
                    候補者にそのまま送れるプロ仕様のスカウト文
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!scoutText}
                  className="mt-2 inline-flex items-center justify-center rounded-2xl border border-slate-600/80 bg-slate-900/70 px-4 py-2 text-[11px] font-medium text-slate-100 shadow-[0_12px_36px_rgba(15,23,42,0.9)] transition hover:border-sky-400/80 hover:text-sky-100 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
                >
                  {copied ? "コピーしました" : "スカウト文をコピー"}
                </button>
              </div>

              <div className="rounded-2xl border border-slate-700/80 bg-slate-950/85 p-4 text-xs leading-relaxed text-slate-100/95 shadow-[0_18px_55px_rgba(15,23,42,0.95)]">
                <pre className="whitespace-pre-wrap font-sans text-[12px] tracking-[0.01em]">
                  {scoutText || initialScoutText}
                </pre>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
