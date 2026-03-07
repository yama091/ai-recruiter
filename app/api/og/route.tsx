import { ImageResponse } from "next/og";

export const runtime = "edge";

// 日本語表示に必須。複数URLを試行（1つ成功すればOK）
const FONT_URLS = [
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.9/files/noto-sans-jp-1-400-normal.woff",
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.8/files/noto-sans-jp-0-400-normal.woff",
];

async function loadFont(): Promise<ArrayBuffer | null> {
  for (const url of FONT_URLS) {
    try {
      const res = await fetch(url, { cache: "force-cache" });
      if (res.ok) return await res.arrayBuffer();
    } catch {
      continue;
    }
  }
  return null;
}

function parseScores(scoresParam: string | null): number[] {
  if (!scoresParam) return [70, 70, 70, 70];
  const parts = scoresParam.split(",").map((s) => parseInt(s.trim(), 10));
  return [
    Math.min(100, Math.max(0, parts[0] ?? 70)),
    Math.min(100, Math.max(0, parts[1] ?? 70)),
    Math.min(100, Math.max(0, parts[2] ?? 70)),
    Math.min(100, Math.max(0, parts[3] ?? 70)),
  ];
}

function decode(s: string | null): string {
  if (!s) return "";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

const LABELS_BUSINESS = ["技術の深さ", "保守性", "学習習慣", "市場需要"];
const TIER_STYLES: Record<string, { bg: string; label: string }> = {
  "S+": { bg: "linear-gradient(135deg, #fbbf24, #d97706)", label: "神域" },
  S: { bg: "linear-gradient(135deg, #a78bfa, #7c3aed)", label: "最上級" },
  A: { bg: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "上級" },
  B: { bg: "linear-gradient(135deg, #22d3ee, #06b6d4)", label: "中級" },
  C: { bg: "linear-gradient(135deg, #34d399, #10b981)", label: "成長中" },
  D: { bg: "linear-gradient(135deg, #94a3b8, #64748b)", label: "発展途上" },
  E: { bg: "linear-gradient(135deg, #64748b, #475569)", label: "初級" },
};

export async function GET(request: Request) {
  const fontData = await loadFont();
  const fonts = fontData
    ? [{ name: "Noto Sans JP", data: fontData, weight: 400 as const, style: "normal" as const }]
    : undefined;
  const fontFamily = fontData ? "Noto Sans JP, sans-serif" : "sans-serif";

  const { searchParams } = new URL(request.url);
  const scores = parseScores(searchParams.get("scores"));
  const title = searchParams.get("title");
  const salary = searchParams.get("salary");
  const rank = searchParams.get("rank");
  const tier = searchParams.get("tier");
  const mode = searchParams.get("mode") || "personal";

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 4);
  const tierStyle = tier && TIER_STYLES[tier] ? TIER_STYLES[tier] : TIER_STYLES["B"];
  const isBusiness = mode === "business";

  const options = { width: 1200, height: 630, ...(fonts && { fonts }) };

  if (isBusiness) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
            fontFamily,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.3em", marginBottom: 8 }}>
            エンジニアスキルレポート
          </div>
          {title ? (
            <div style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{decode(title)}</div>
          ) : null}
          {salary ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, letterSpacing: "0.15em" }}>推定市場価格</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>{decode(salary)}</div>
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "row", gap: 48 }}>
            {LABELS_BUSINESS.map((label, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: `conic-gradient(#2563eb ${scores[i] * 3.6}deg, #e2e8f0 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #cbd5e1",
                  }}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#1e293b",
                    }}
                  >
                    {scores[i]}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginTop: 16 }}>総合スコア {avg}/100</div>
        </div>
      ),
      options
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#08080a",
          fontFamily,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.28em", marginBottom: 12 }}>
          AI市場価値鑑定
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              padding: "32px 48px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(251, 191, 36, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.15em", marginBottom: 8 }}>
              推定年収
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#fff" }}>{salary ? decode(salary) : "—"}</div>
          </div>
          <div
            style={{
              padding: "32px 48px",
              borderRadius: 24,
              background: tier ? tierStyle.bg : "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "2px solid rgba(255,255,255,0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.15em", marginBottom: 8 }}>
              ランク
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontSize: 64, fontWeight: 900, color: "#fff" }}>
                {tier ? decode(tier) : rank ? decode(rank) : "—"}
              </span>
              {tier ? (
                <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>{tierStyle.label}</span>
              ) : null}
            </div>
          </div>
        </div>
        {title ? (
          <div style={{ fontSize: 24, fontWeight: 700, color: "#c4b5fd", marginBottom: 8 }}>{decode(title)}</div>
        ) : null}
        <div style={{ fontSize: 15, fontWeight: 600, color: "#71717a" }}>総合スコア {avg}/100 · GitHubベースの鑑定</div>
      </div>
    ),
    options
  );
}
