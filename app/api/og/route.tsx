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

const LABELS = ["Technical", "Contribution", "Sustainability", "Market"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scores = parseScores(searchParams.get("scores"));
  const title = searchParams.get("title"); // Job title e.g. "Legendary Full-stack"
  const salary = searchParams.get("salary");
  const rank = searchParams.get("rank");

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
          background: "linear-gradient(180deg, #030303 0%, #0a0a0c 50%, #030303 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "2px solid rgba(255,255,255,0.06)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse 90% 60% at 50% -20%, rgba(99, 102, 241, 0.25), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(139, 92, 246, 0.15), transparent 45%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            padding: 48,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, color: "#71717a", letterSpacing: "0.3em" }}>
            AI MARKET VALUE CERTIFICATION
          </div>

          {title && (
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #a5b4fc, #c4b5fd)",
                color: "transparent",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                textAlign: "center",
                padding: "0 24px",
              }}
            >
              {decodeURIComponent(title)}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "row", gap: 28, marginTop: 8 }}>
            {salary && (
              <div
                style={{
                  padding: "16px 28px",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6, letterSpacing: "0.1em" }}>EST. SALARY</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{decodeURIComponent(salary)}</div>
              </div>
            )}
            {rank && (
              <div
                style={{
                  padding: "16px 28px",
                  background: "rgba(99, 102, 241, 0.25)",
                  borderRadius: 14,
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                }}
              >
                <div style={{ fontSize: 12, color: "#a5b4fc", marginBottom: 6, letterSpacing: "0.1em" }}>RANK</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{decodeURIComponent(rank)}</div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "row", gap: 36, marginTop: 16 }}>
            {LABELS.map((label, i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: `conic-gradient(#6366f1 ${scores[i] * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 1px rgba(0,0,0,0.3) inset",
                  }}
                >
                  <div
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: "50%",
                      background: "#030303",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {scores[i]}
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#d4d4d8" }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, fontSize: 15, color: "#52525b" }}>
            Total Score {avg}/100 · GitHub-based certification
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
