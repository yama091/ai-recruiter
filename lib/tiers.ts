/** Tier grades: S+ (Godly) down to E (Junior). Used for badges, OGP, and share. */
export const TIER_ORDER = ["S+", "S", "A", "B", "C", "D", "E"] as const;
export type TierGrade = (typeof TIER_ORDER)[number];

export type TierConfig = {
  grade: TierGrade;
  labelEn: string;
  labelJa: string;
  /** CSS gradient for badge/glow */
  gradient: string;
  /** Border/glow color */
  color: string;
  /** Optional emoji or short badge symbol */
  badgeSymbol: string;
};

export const TIER_CONFIGS: Record<TierGrade, TierConfig> = {
  "S+": {
    grade: "S+",
    labelEn: "Godly",
    labelJa: "神域",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
    color: "#fbbf24",
    badgeSymbol: "◆",
  },
  S: {
    grade: "S",
    labelEn: "Elite",
    labelJa: "最上級",
    gradient: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
    color: "#a78bfa",
    badgeSymbol: "◇",
  },
  A: {
    grade: "A",
    labelEn: "Senior",
    labelJa: "上級",
    gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "#6366f1",
    badgeSymbol: "●",
  },
  B: {
    grade: "B",
    labelEn: "Solid",
    labelJa: "中級",
    gradient: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
    color: "#22d3ee",
    badgeSymbol: "●",
  },
  C: {
    grade: "C",
    labelEn: "Growing",
    labelJa: "成長中",
    gradient: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
    color: "#34d399",
    badgeSymbol: "○",
  },
  D: {
    grade: "D",
    labelEn: "Rising",
    labelJa: "発展途上",
    gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    color: "#94a3b8",
    badgeSymbol: "○",
  },
  E: {
    grade: "E",
    labelEn: "Junior",
    labelJa: "初級",
    gradient: "linear-gradient(135deg, #64748b 0%, #475569 100%)",
    color: "#94a3b8",
    badgeSymbol: "○",
  },
};

export function getTierConfig(tier: string): TierConfig {
  const grade = TIER_ORDER.includes(tier as TierGrade) ? (tier as TierGrade) : "B";
  return TIER_CONFIGS[grade];
}
