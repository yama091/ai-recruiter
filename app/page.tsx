"use client";

import { JSX, useState } from "react";

function InlineBold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-white">{part}</strong>
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
        <table key={i} className="my-3 w-full border-collapse text-sm">
          <thead>
            <tr>
              {headers.map((h, j) => (
                <th
                  key={j}
                  className="border border-amber-900/50 bg-slate-900/80 px-3 py-2 text-left text-amber-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, j) => (
              <tr key={j} className="border-b border-slate-700">
                {row.map((cell, k) => (
                  <td
                    key={k}
                    className="border border-slate-600 px-3 py-2 text-slate-300"
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
        <h3 key={i} className="mb-1 mt-4 text-lg font-bold text-amber-200">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      result.push(
        <h2 key={i} className="mb-1 mt-4 text-xl font-bold text-amber-100">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      result.push(
        <h1 key={i} className="mb-2 mt-4 text-2xl font-black text-white">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith("- ")) {
      result.push(
        <li key={i} className="ml-4 list-disc text-slate-300">
          <InlineBold text={line.slice(2)} />
        </li>
      );
    } else if (line.trim() === "") {
      result.push(<div key={i} className="h-2" />);
    } else {
      result.push(
        <p key={i} className="leading-relaxed text-slate-300">
          <InlineBold text={line} />
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-1">{result}</div>;
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
    <main className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-2xl space-y-12 px-4 py-12 sm:px-6">
        <header className="text-center space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500/90">
            High-End Engineer Valuation
          </p>
          <h1 className="bg-gradient-to-r from-amber-200 via-white to-amber-100 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
            AI市場価値鑑定
          </h1>
          <p className="text-slate-400 text-base font-medium sm:text-lg">
            GitHubからあなたの真の価値を1円単位で算出。データに基づく冷徹な鑑定書を発行します。
          </p>
        </header>

        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-2xl ring-1 ring-amber-500/10 sm:p-8">
          <div className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="GitHubのURL（例: https://github.com/username）"
              className="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3.5 text-base outline-none transition placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 sm:text-lg"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            {error && (
              <p className="text-sm font-medium text-amber-400">{error}</p>
            )}
            <button
              onClick={analyze}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-amber-900/30 transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "鑑定中..." : "精密査定を実行する"}
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-8">
            <div className="rounded-3xl border border-amber-900/40 bg-slate-900/70 p-6 shadow-2xl ring-1 ring-amber-500/10 sm:p-8">
              <SimpleMarkdown content={result} />
            </div>

            <div className="space-y-4">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                鑑定結果をシェアしてキャリアを広げる
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black shadow-xl transition hover:bg-slate-100"
                >
                  𝕏 で結果をシェア
                </a>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-600/90 to-amber-700/90 py-4 font-bold text-white shadow-xl shadow-amber-900/20 transition hover:opacity-95"
                >
                  年収UPのオファーを受ける
                </a>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-amber-500/30 bg-slate-900/80 p-6 sm:p-8">
              <p className="mb-2 text-center text-sm font-bold uppercase tracking-wider text-amber-400">
                おすすめキャリア枠
              </p>
              <p className="text-center text-sm text-slate-400">
                年収1,000万超えを目指すエンジニア向けの転職・副業サービスを厳選してご紹介（準備中）
              </p>
              <div className="mt-4 flex justify-center">
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 text-sm font-semibold text-amber-200 transition hover:bg-slate-700"
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
