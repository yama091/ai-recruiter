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
const LABELS_BUSINESS = ["技術スタックの専門性", "コードの保守性", "継続的な学習習慣", "市場価値"];

const TIER_STYLES: Record<string, { bg: string; label: string }> = {
  "S+": { bg: "linear-gradient(135deg, #fbbf24, #d97706)", label: "神域" },
  S: { bg: "linear-gradient(135deg, #a78bfa, #7c3aed)", label: "最上級" },
  A: { bg: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "上級" },
  B: { bg: "linear-gradient(135deg, #22d3ee, #06b6d4)", label: "中級" },
  C: { bg: "linear-gradient(135deg, #34d399, #10b981)", label: "成長中" },
  D: { bg: "linear-gradient(135deg, #94a3b8, #64748b)", label: "発展途上" },
  E: { bg: "linear-gradient(135deg, #64748b, #475569)", label: "初級" },
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
                <div style={{ fontSize: 10, color: "#64748b", marginBottom: 4, letterSpacing: "0.15em" }}>推定市場価格</div>
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
            {LABELS_BUSINESS.map((label, i) => (
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
            総合スコア {avg}/100 · GitHubベースの鑑定
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
          justifyContent: "center",
          background: "#08080a",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 100% 80% at 50% -20%, rgba(99, 102, 241, 0.4), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 80%, rgba(139, 92, 246, 0.25), transparent 45%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "4px solid rgba(251, 191, 36, 0.25)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            pointerEvents: "none",
          }}
        />

        <div style={{ paddingTop: 40, zIndex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.28em" }}>
            AI市場価値鑑定
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 48,
            flex: 1,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 48px",
              borderRadius: 24,
              background: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(251, 191, 36, 0.4)",
              minWidth: 320,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.15em", marginBottom: 12 }}>
              推定年収
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {salary ? decode(salary) : "—"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 48px",
              borderRadius: 24,
              background: tier ? tierStyle.bg : "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "2px solid rgba(255,255,255,0.2)",
              minWidth: 280,
              boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.15em", marginBottom: 12 }}>
              ランク
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 64, fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                {tier ? decode(tier) : rank ? decode(rank) : "—"}
              </span>
              {tier && (
                <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>
                  {tierStyle.label}
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingBottom: 44, zIndex: 1 }}>
          {title && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#c4b5fd",
                letterSpacing: "-0.01em",
                textAlign: "center",
              }}
            >
              {decode(title)}
            </div>
          )}
          <div style={{ fontSize: 15, fontWeight: 600, color: "#71717a" }}>
            総合スコア {avg}/100
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
