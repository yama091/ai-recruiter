"use client";

import { useCallback, useState } from "react";

const initialProfile = {
  githubUrl: "https://github.com/example/awesome-engineer",
  technologies: [
    "TypeScript",
    "Next.js",
    "React",
    "Node.js",
    "GraphQL",
    "AWS",
  ],
  salaryRange: "900〜1,100万円",
  motivationScore: 8.4,
  motivationText: "高い（直近6ヶ月で活発にOSS活動・個人開発を継続）",
};

const initialScoutText = `〇〇様

突然のご連絡失礼いたします。  
GitHub上でのTypeScript / Next.jsを中心とした実績を拝見し、ご連絡させていただきました。

・パフォーマンスチューニングを意識した実装
・クリーンなコンポーネント設計とStorybookを用いたUI管理
・継続的なOSSへのコントリビュート

などから、プロダクト志向かつ自走力の高いフロントエンドエンジニアでいらっしゃると感じています。

弊社では、BtoB SaaSプロダクトのコアフロントエンドをお任せできる方を探しており、  
ご経験・ご志向と非常に近しいのではないかと思いご連絡しました。

カジュアルに30分ほどオンラインでお話できませんか？`;

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
      ? "from-violet-500/20 to-fuchsia-500/5 border-violet-500/40"
      : accent === "emerald"
      ? "from-emerald-500/20 to-cyan-500/5 border-emerald-500/40"
      : "from-sky-500/20 to-indigo-500/5 border-sky-500/40";

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${accentClass} bg-slate-900/40 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.7)] backdrop-blur`}>
      <div className="pointer-events-none absolute inset-px rounded-2xl bg-gradient-to-br from-white/5 via-white/0 to-white/0" />
      <div className="relative flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {title}
        </span>
        <p className="text-xl font-semibold text-slate-50">{value}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
};

export default function Home() {
  const [githubUrl, setGithubUrl] = useState(initialProfile.githubUrl);
  const [profile, setProfile] = useState(initialProfile);
  const [scoutText, setScoutText] = useState(initialScoutText);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromAI, setIsFromAI] = useState(false);

  const handleAnalyze = useCallback(async () => {
    const trimmed = githubUrl.trim();
    if (!trimmed) {
      setError("GitHub URLを入力してください。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsFromAI(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ githubUrl: trimmed }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "AI分析に失敗しました。");
      }

      const data = (await res.json()) as {
        technologies: string[];
        salaryRange: string;
        motivationScore: number;
        motivationText: string;
        scoutText: string;
      };

      setProfile({
        githubUrl: trimmed,
        technologies: data.technologies ?? [],
        salaryRange: data.salaryRange ?? initialProfile.salaryRange,
        motivationScore:
          typeof data.motivationScore === "number"
            ? data.motivationScore
            : initialProfile.motivationScore,
        motivationText: data.motivationText ?? initialProfile.motivationText,
      });
      setScoutText(data.scoutText || initialScoutText);
      setIsFromAI(true);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "予期せぬエラーが発生しました。時間をおいて再度お試しください。",
      );
    } finally {
      setIsLoading(false);
    }
  }, [githubUrl]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      {/* Sidebar */}
      <aside className="hidden border-r border-slate-800/80 bg-slate-950/80 px-5 py-6 backdrop-blur-xl md:flex md:w-64 lg:w-72">
        <div className="flex w-full flex-col gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400 shadow-[0_0_40px_rgba(56,189,248,0.6)]">
              <span className="text-xs font-bold tracking-tight text-slate-950">
                AI
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-slate-50">
                Recruiter
              </span>
              <span className="text-xs text-slate-500">Engineering Talent OS</span>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1 text-sm">
            <button className="flex items-center justify-between rounded-xl bg-slate-800/80 px-3 py-2 text-slate-50 shadow-[0_0_30px_rgba(15,23,42,0.8)] ring-1 ring-sky-500/40 transition hover:bg-slate-700/80">
              <span className="flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                <span>ダッシュボード</span>
              </span>
              <span className="rounded-full bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-slate-300">
                LIVE
              </span>
            </button>
            <button className="rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-800/60 hover:text-slate-50">
              候補者管理
            </button>
            <button className="rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-800/60 hover:text-slate-50">
              スカウト設定
            </button>
            <button className="rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-800/60 hover:text-slate-50">
              報酬管理
            </button>
          </nav>

          <div className="mt-auto space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-3 text-xs text-slate-400">
            <p className="font-medium text-slate-200">AIスカウト精度</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px]">今週のマッチ率</span>
              <span className="text-sm font-semibold text-emerald-400">
                87%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800">
              <div className="h-1.5 w-[87%] rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.9)]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex w-full flex-1 flex-col gap-6 px-4 py-5 md:px-6 lg:px-8">
        {/* Top bar (mobile branding) */}
        <div className="mb-1 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400">
              <span className="text-[10px] font-semibold tracking-tight text-slate-950">
                AI
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-50">
              Recruiter
            </span>
          </div>
          <span className="rounded-full bg-slate-900/70 px-3 py-1 text-[10px] text-slate-400 ring-1 ring-slate-700">
            ダッシュボード
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-6 lg:flex-row">
          {/* Main left column */}
          <section className="flex flex-1 flex-col gap-5">
            {/* GitHub URL form */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-5 shadow-[0_22px_80px_rgba(15,23,42,0.85)] backdrop-blur-xl md:p-6">
              <div className="pointer-events-none absolute inset-px rounded-3xl bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/10" />
              <div className="relative flex flex-col gap-4 md:gap-5">
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sky-300/80">
                    AI SCOUTING PIPELINE
                  </p>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-50 md:text-2xl">
                    GitHub URLを入力して分析開始
                  </h1>
                  <p className="text-xs text-slate-400 md:text-sm">
                    リポジトリのコミット頻度・技術スタック・コードクオリティから、
                    <span className="text-sky-300"> 推定年収 </span>
                    と
                    <span className="text-sky-300"> 転職意欲 </span>
                    をAIがリアルタイムに推定します。
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="flex-1">
                    <label
                      htmlFor="github-url"
                      className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-300"
                    >
                      GitHub Repository URL
                      {isFromAI ? (
                        <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300 ring-1 ring-emerald-500/40">
                          AI LIVE
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800/80 px-1.5 py-0.5 text-[9px] text-slate-400">
                          MOCK
                        </span>
                      )}
                    </label>
                    <div className="relative mt-1">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-slate-700/80 bg-slate-900/80 shadow-[0_0_40px_rgba(15,23,42,0.9)]" />
                      <input
                        id="github-url"
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="relative w-full rounded-2xl bg-transparent px-3.5 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                        placeholder="https://github.com/username/repository"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(56,189,248,0.65)] transition hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 md:mt-5 md:self-end"
                  >
                    {isLoading ? "分析中..." : "AIで分析する"}
                    <span className="h-1 w-1 rounded-full bg-slate-900" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
                    {isFromAI
                      ? "OpenAI gpt-4o から取得した結果を表示中です。"
                      : "現在は初期モックデータを表示中です。AI分析ボタンで更新できます。"}
                  </div>
                  {error && (
                    <span className="truncate text-[10px] text-rose-300">
                      {error}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard
                title="使用技術スタック"
                value={
                  profile.technologies.length > 0
                    ? profile.technologies.slice(0, 3).join(" / ")
                    : "解析中..."
                }
                description="代表的な技術。詳細はタグ一覧から確認できます。"
                accent="blue"
              />
              <StatCard
                title="推定年収レンジ"
                value={profile.salaryRange}
                description="GitHubアクティビティ・職務内容ベースの仮推定です。"
                accent="emerald"
              />
              <StatCard
                title="転職意欲スコア"
                value={`${profile.motivationScore.toFixed(1)} / 10`}
                description={profile.motivationText}
                accent="violet"
              />
            </div>

            {/* Tech tags & insight */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-sky-300">
                    TECH PROFILE
                  </span>
                  <span>検知された主要技術</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  コミットメッセージ・依存関係・ディレクトリ構成を総合判定
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/80 px-2.5 py-1 text-[11px] text-slate-100 shadow-[0_0_16px_rgba(15,23,42,0.9)]"
                  >
                    <span className="h-1 w-1 rounded-full bg-sky-400" />
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Right column: scout text editor */}
          <section className="w-full shrink-0 space-y-3 rounded-3xl border border-slate-800/80 bg-slate-950/85 p-4 shadow-[0_22px_80px_rgba(15,23,42,0.9)] backdrop-blur-xl sm:w-[360px] lg:w-[380px] xl:w-[420px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-[0.22em] text-violet-300/80">
                  AI GENERATED DRAFT
                </span>
                <h2 className="text-sm font-semibold text-slate-50">
                  刺さるスカウト文（プレビュー）
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-slate-900/70 px-2 py-0.5 text-[10px] text-slate-400 ring-1 ring-slate-700">
                  編集可能
                </span>
                <span className="text-[10px] text-slate-500">
                  候補者ごとに自動再生成
                </span>
              </div>
            </div>

            <div className="relative mt-1 flex-1">
              <div className="pointer-events-none absolute inset-0 rounded-2xl border border-slate-800/90 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
              <textarea
                value={scoutText}
                onChange={(e) => setScoutText(e.target.value)}
                className="relative h-64 w-full resize-none rounded-2xl bg-transparent px-3.5 py-3 text-xs leading-relaxed text-slate-100 outline-none placeholder:text-slate-500 md:h-72"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                <span>候補者のGitHubプロファイルに最適化されたトーンで生成</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex gap-1.5 text-[11px] text-slate-400">
                <span className="rounded-full bg-slate-900/80 px-2 py-0.5">
                  テンプレート
                </span>
                <span className="rounded-full bg-slate-900/80 px-2 py-0.5">
                  候補者に合わせて微調整
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-950 shadow-[0_14px_30px_rgba(15,23,42,0.9)] transition hover:bg-white"
              >
                下書きを保存
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
