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
  const salary = searchParams.get("salary"); // optional e.g. "12,345,678円"
  const rank = searchParams.get("rank"); // optional e.g. "A"

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 4);

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
          background: "linear-gradient(180deg, #08080a 0%, #0c0c10 50%, #08080a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glass-style border */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 0,
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 85% 55% at 50% -15%, rgba(99, 102, 241, 0.18), transparent 55%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            padding: 56,
          }}
        >
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: "#71717a",
              letterSpacing: "0.28em",
            }}
          >
            AI市場価値鑑定
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.02em",
            }}
          >
            鑑定結果サマリー
          </div>

          {(salary || rank) && (
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 32,
                marginBottom: 8,
              }}
            >
              {salary && (
                <div
                  style={{
                    padding: "14px 24px",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#a1a1aa", marginBottom: 4 }}>想定年収</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{salary}</div>
                </div>
              )}
              {rank && (
                <div
                  style={{
                    padding: "14px 24px",
                    background: "rgba(99, 102, 241, 0.2)",
                    borderRadius: 12,
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}
                >
                  <div style={{ fontSize: 14, color: "#a5b4fc", marginBottom: 4 }}>技術力ランク</div>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{rank}</div>
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 44,
              marginTop: 8,
            }}
          >
            {LABELS.map((label, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 112,
                    height: 112,
                    borderRadius: "50%",
                    background: `conic-gradient(#6366f1 ${scores[i] * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.2) inset",
                  }}
                >
                  <div
                    style={{
                      width: 82,
                      height: 82,
                      borderRadius: "50%",
                      background: "#08080a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 26,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {scores[i]}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 18,
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
              marginTop: 20,
              fontSize: 16,
              color: "#52525b",
            }}
          >
            GitHubベースの市場価値診断 — 総合スコア {avg}/100
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
