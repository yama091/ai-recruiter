import { ImageResponse } from "next/og";

export const runtime = "edge";

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

const LABELS = ["技術力", "貢献度", "継続力", "市場性"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scores = parseScores(searchParams.get("scores"));

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
          background: "linear-gradient(180deg, #0a0a0f 0%, #111118 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99, 102, 241, 0.2), transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 32,
            padding: 48,
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#a1a1aa",
              letterSpacing: "0.2em",
            }}
          >
            AI市場価値鑑定
          </div>
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            鑑定結果サマリー
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 40,
              marginTop: 24,
            }}
          >
            {LABELS.map((label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    background: `conic-gradient(#6366f1 ${scores[i] * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 88,
                      height: 88,
                      borderRadius: "50%",
                      background: "#0a0a0f",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {scores[i]}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "#d4d4d8",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 24,
              fontSize: 18,
              color: "#71717a",
            }}
          >
            GitHubベースの市場価値診断 — 1円単位の想定年収・強みを可視化
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
