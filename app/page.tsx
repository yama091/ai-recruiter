"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

export default function Home() {
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!githubUrl) return alert("URLを入力してください");
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ githubUrl }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (e) {
      alert("エラーが発生しました");
    }
    setLoading(false);
  };

  const shareText = encodeURIComponent(`【AI市場価値鑑定】私の推定年収はこんな感じでした！\n#AI査定 #エンジニア転職\n`);
  const shareUrl = encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-12 py-12">
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-blue-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
            AI市場価値鑑定
          </h1>
          <p className="text-slate-400 text-lg font-medium">GitHubからあなたの真の価値を1円単位で算出します</p>
        </header>

        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl ring-1 ring-white/5">
          <div className="flex flex-col gap-6">
            <input
              type="text"
              placeholder="GitHubのURL（例: https://github.com/username）"
              className="bg-slate-950 border border-slate-700 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg transition-all placeholder:text-slate-600"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            <button
              onClick={analyze}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "鑑定中..." : "精密査定を実行する"}
            </button>
          </div>
        </section>

        {result && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-slate-900 p-8 rounded-3xl border border-blue-500/20 shadow-2xl prose prose-invert max-w-none shadow-blue-500/5">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-white text-black font-bold py-4 rounded-xl hover:bg-slate-200 transition-all shadow-xl"
              >
                𝕏 で結果をシェア
              </a>
              <a
                href="https://google.com" 
                target="_blank"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all border border-emerald-400/20 shadow-xl shadow-emerald-900/20"
              >
                年収UPのオファーを受ける
              </a>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}