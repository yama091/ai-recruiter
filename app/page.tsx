"use client";

import { JSX, useState } from "react";

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
        setError(data.error || "鑑定に失敗しました");
        return;
      }
      setResult(data.result ?? "");
    } catch {
      setResult("");
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
    typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0f] font-sans text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-mesh" aria-hidden />

      <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <header className="space-y-5 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 backdrop-blur-sm"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.2) inset" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400/80" />
            High-End Engineer Valuation
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            AI市場価値鑑定
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-zinc-500 sm:text-lg">
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
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-[15px] text-white outline-none transition-all duration-200 placeholder:text-zinc-600 focus:border-white/[0.15] focus:bg-white/[0.06] focus:ring-2 focus:ring-white/[0.08] sm:text-base"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            {error && (
              <p className="text-sm font-medium text-rose-400/90">{error}</p>
            )}
            <button
              onClick={analyze}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-[15px] font-medium text-black shadow-lg shadow-black/20 transition-all duration-200 hover:bg-zinc-100 hover:shadow-xl hover:shadow-black/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
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
          <section className="mt-14 space-y-8 animate-fade-in-up">
            <div className="rounded-2xl glass-panel-strong overflow-hidden p-6 sm:p-8">
              <SimpleMarkdown content={result} />
            </div>

            <div className="space-y-4">
              <p className="text-center text-[11px] font-medium uppercase tracking-widest text-zinc-600">
                鑑定結果をシェア
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] py-3.5 text-sm font-medium text-zinc-200 backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.06] hover:border-white/[0.12]"
                >
                  𝕏 で結果をシェア
                </a>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.05] py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.12]"
                >
                  年収UPのオファーを受ける
                </a>
              </div>
            </div>

            <div
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm sm:p-8"
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.15) inset" }}
            >
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
