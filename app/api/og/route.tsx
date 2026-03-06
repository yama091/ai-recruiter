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

const TIER_STYLES: Record<string, { bg: string; label: string }> = {
  "S+": { bg: "linear-gradient(135deg, #fbbf24, #d97706)", label: "GODLY" },
  S: { bg: "linear-gradient(135deg, #a78bfa, #7c3aed)", label: "ELITE" },
  A: { bg: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "SENIOR" },
  B: { bg: "linear-gradient(135deg, #22d3ee, #06b6d4)", label: "SOLID" },
  C: { bg: "linear-gradient(135deg, #34d399, #10b981)", label: "GROWING" },
  D: { bg: "linear-gradient(135deg, #94a3b8, #64748b)", label: "RISING" },
  E: { bg: "linear-gradient(135deg, #64748b, #475569)", label: "JUNIOR" },
};

function decode(s: string | null): string {
  if (!s) return "";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scores = parseScores(searchParams.get("scores"));
  const title = searchParams.get("title");
  const salary = searchParams.get("salary");
  const rank = searchParams.get("rank");
  const tier = searchParams.get("tier");
  const feedback = searchParams.get("feedback");
  const mode = searchParams.get("mode") || "personal";

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / 4);
  const tierStyle = tier && TIER_STYLES[tier] ? TIER_STYLES[tier] : TIER_STYLES["B"];
  const isBusiness = mode === "business";

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
            background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: "2px solid #cbd5e1",
              pointerEvents: "none",
            }}
          />
          <div style={{ paddingTop: 56, zIndex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.3em" }}>
              ENGINEER SKILL REPORT
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              padding: "0 64px",
              zIndex: 1,
            }}
          >
            {title && (
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1e293b", letterSpacing: "-0.02em", textAlign: "center" }}>
                {decode(title)}
              </div>
            )}
            {salary && (
              <div
                style={{
                  padding: "16px 32px",
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, letterSpacing: "0.15em" }}>EST. MARKET VALUE</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#1d4ed8" }}>{decode(salary)}</div>
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 48,
              paddingBottom: 56,
              zIndex: 1,
            }}
          >
            {LABELS.map((label, i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
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
          <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginTop: -16 }}>
            Total Score {avg}/100 · GitHub-based assessment
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
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
          justifyContent: "space-between",
          background: "#030303",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 100% 80% at 50% -30%, rgba(99, 102, 241, 0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(139, 92, 246, 0.2), transparent 50%), radial-gradient(ellipse 50% 40% at 0% 80%, rgba(99, 102, 241, 0.15), transparent 45%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "3px solid rgba(255,255,255,0.08)",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        />

        <div style={{ paddingTop: 48, zIndex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#71717a", letterSpacing: "0.35em" }}>
            AI MARKET VALUE CERTIFICATION
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            padding: "0 56px",
            zIndex: 1,
          }}
        >
          {(tier || rank) && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px 44px",
                borderRadius: 16,
                background: tier ? tierStyle.bg : "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
              }}
            >
              <span style={{ fontSize: 42, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                {tier ? `TIER ${decode(tier)}` : `RANK ${decode(rank)}`}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginLeft: 16, letterSpacing: "0.15em" }}>
                {tier ? tierStyle.label : ""}
              </span>
            </div>
          )}

          {title && (
            <div
              style={{
                fontSize: 38,
                fontWeight: 800,
                letterSpacing: "-0.02em",
                background: "linear-gradient(90deg, #a5b4fc, #e9d5ff)",
                color: "transparent",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                textAlign: "center",
                maxWidth: "90%",
              }}
            >
              {decode(title)}
            </div>
          )}

          {salary && (
            <div
              style={{
                padding: "18px 36px",
                background: "rgba(255,255,255,0.07)",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6, letterSpacing: "0.2em" }}>EST. SALARY</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#fff" }}>{decode(salary)}</div>
            </div>
          )}

          {feedback && (
            <div style={{ fontSize: 16, fontStyle: "italic", color: "#a1a1aa", textAlign: "center", maxWidth: 700 }}>
              &ldquo;{decode(feedback)}&rdquo;
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            paddingBottom: 48,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: 40 }}>
            {LABELS.map((label, i) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 88,
                    height: 88,
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
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#0a0a0c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                      color: "#fff",
                    }}
                  >
                    {scores[i]}
                  </div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#d4d4d8" }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#52525b" }}>
            Total Score {avg}/100
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
