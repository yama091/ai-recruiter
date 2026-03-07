import { ImageResponse } from "next/og";

export const runtime = "edge";

// 日本語表示に必須: satoriは system-ui で日本語を描画できないため、フォントを明示的に読み込む
const NOTO_SANS_JP_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.2.9/files/noto-sans-jp-1-400-normal.woff";

async function loadFont(): Promise<ArrayBuffer> {
  const res = await fetch(NOTO_SANS_JP_URL);
  if (!res.ok) throw new Error("Failed to load font");
  return res.arrayBuffer();
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

// 軽量化: フォントは日本語表示のため必須。複雑な装飾なしで1秒以内に応答
export async function GET(request: Request) {
  let fontData: ArrayBuffer;
  try {
    fontData = await loadFont();
  } catch {
    return new Response("Failed to load font", { status: 500 });
  }

  const fonts = [
    { name: "Noto Sans JP", data: fontData, weight: 400 as const, style: "normal" as const },
  ];

  const { searchParams } = new URL(request.url);
  const scores = parseScores(searchParams.get("scores"));
  const title = searchParams.get("title");
  const salary = searchParams.get("salary");
  const tier = searchParams.get("tier");
  const mode = searchParams.get("mode") || "personal";

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 4);
  const isBusiness = mode === "business";

  const fontFamily = "Noto Sans JP, sans-serif";

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
          <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>エンジニアスキルレポート</div>
          {title ? <div style={{ fontSize: 36, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{decode(title)}</div> : null}
          {salary ? <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>{decode(salary)}</div> : null}
          <div style={{ fontSize: 14, color: "#64748b", marginTop: 16 }}>総合スコア {avg}/100</div>
        </div>
      ),
      { width: 1200, height: 630, fonts }
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
        <div style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 12 }}>AI市場価値鑑定</div>
        {title ? <div style={{ fontSize: 32, fontWeight: 700, color: "#e4e4e7", marginBottom: 8 }}>{decode(title)}</div> : null}
        {salary ? <div style={{ fontSize: 48, fontWeight: 800, color: "#fbbf24", marginBottom: 4 }}>{decode(salary)}</div> : null}
        {tier ? <div style={{ fontSize: 28, fontWeight: 700, color: "#c4b5fd" }}>{decode(tier)}</div> : null}
        <div style={{ fontSize: 14, color: "#71717a", marginTop: 16 }}>総合スコア {avg}/100 · GitHubベースの鑑定</div>
      </div>
    ),
    { width: 1200, height: 630, fonts }
  );
}
