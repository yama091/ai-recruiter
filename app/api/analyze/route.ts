import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const analysisCache = new Map<
  string,
  { result: string; scores: RadarScores; jobTitle: string; salaryDisplay: string; rank: string; tier: string; tierFeedback: string }
>();

function getAnalysisCache(username: string) {
  return analysisCache.get(username) ?? null;
}

function setAnalysisCache(
  username: string,
  data: { result: string; scores: RadarScores; jobTitle: string; salaryDisplay: string; rank: string; tier: string; tierFeedback: string }
) {
  analysisCache.set(username, data);
  if (analysisCache.size > 500) {
    const first = analysisCache.keys().next().value;
    if (first) analysisCache.delete(first);
  }
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h = (h << 5) - h + c;
    h |= 0;
  }
  return Math.abs(h) % 2147483647;
}

function extractUsername(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!/^https?:\/\/github\.com/i.test(u.origin)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[0] || null;
  } catch {
    return null;
  }
}

async function fetchGitHubData(username: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "ai-recruiter-app",
  };
  if (process.env.GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const [userRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers, cache: "no-store" }),
    fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=10`,
      { headers, cache: "no-store" }
    ),
  ]);

  if (!userRes.ok) {
    throw new Error(`GitHubユーザーが見つかりません: ${username}`);
  }

  const user = await userRes.json();
  const repos = reposRes.ok ? await reposRes.json() : [];

  const languages: Record<string, number> = {};
  let totalStars = 0;
  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
    totalStars += repo.stargazers_count || 0;
  }

  const createdAt = user.created_at ? new Date(user.created_at) : null;
  const accountYears = createdAt
    ? Math.max(0, (Date.now() - createdAt.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  return {
    name: user.name || username,
    bio: user.bio || "なし",
    followers: user.followers || 0,
    publicRepos: user.public_repos || 0,
    totalStars,
    accountYears: Math.round(accountYears * 10) / 10,
    company: user.company || "不明",
    location: user.location || "不明",
    topLanguages: Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang),
    topRepos: repos.slice(0, 5).map((r: { name: string; stargazers_count: number; description?: string; language?: string }) => ({
      name: r.name,
      stars: r.stargazers_count,
      description: r.description || "",
      language: r.language || "不明",
    })),
  };
}

export type RadarScores = {
  technical: number;
  contribution: number;
  sustainability: number;
  market: number;
};

const DEFAULT_SCORES: RadarScores = {
  technical: 70,
  contribution: 70,
  sustainability: 70,
  market: 70,
};

export type CertificationMeta = {
  jobTitle: string;
  salaryDisplay: string;
  rank: string;
  tier: string;
  tierFeedback: string;
};

const VALID_TIERS = ["S+", "S", "A", "B", "C", "D", "E"] as const;

function parseScoresFromContent(content: string): {
  markdown: string;
  scores: RadarScores;
  jobTitle: string;
  salaryDisplay: string;
  rank: string;
  tier: string;
  tierFeedback: string;
} {
  const jsonBlock = content.match(/```json\s*([\s\S]*?)\s*```/);
  const defaultMeta = {
    jobTitle: "フルスタックの設計士",
    salaryDisplay: "—",
    rank: "B",
    tier: "B",
    tierFeedback: "土台は十分。あとは可視化と実績で一段上へ。",
  };
  if (jsonBlock) {
    const markdown = content.replace(/\s*```json[\s\S]*?```\s*$/, "").trim();
    try {
      const parsed = JSON.parse(jsonBlock[1].trim()) as Record<string, unknown>;
      const scores: RadarScores = {
        technical: Math.min(100, Math.max(0, Number(parsed.technical) || DEFAULT_SCORES.technical)),
        contribution: Math.min(100, Math.max(0, Number(parsed.contribution) || DEFAULT_SCORES.contribution)),
        sustainability: Math.min(100, Math.max(0, Number(parsed.sustainability) || DEFAULT_SCORES.sustainability)),
        market: Math.min(100, Math.max(0, Number(parsed.market) || DEFAULT_SCORES.market)),
      };
      const tier =
        typeof parsed.tier === "string" && VALID_TIERS.includes(parsed.tier as (typeof VALID_TIERS)[number])
          ? parsed.tier
          : defaultMeta.tier;
      return {
        markdown,
        scores,
        jobTitle: typeof parsed.jobTitle === "string" ? parsed.jobTitle : defaultMeta.jobTitle,
        salaryDisplay: typeof parsed.salaryDisplay === "string" ? parsed.salaryDisplay : defaultMeta.salaryDisplay,
        rank: typeof parsed.rank === "string" ? parsed.rank : defaultMeta.rank,
        tier,
        tierFeedback:
          typeof parsed.tierFeedback === "string" && parsed.tierFeedback.trim()
            ? parsed.tierFeedback.trim()
            : defaultMeta.tierFeedback,
      };
    } catch {
      return { markdown: content.trim(), scores: DEFAULT_SCORES, ...defaultMeta };
    }
  }
  return { markdown: content.trim(), scores: DEFAULT_SCORES, ...defaultMeta };
}

function buildSystemPrompt(locale: "ja" | "en", mode: "personal" | "business"): string {
  const isJa = locale === "ja";
  const isBusiness = mode === "business";
  const jobTitleRule = isBusiness
    ? (isJa
      ? "プロフェッショナルな日本語の称号のみ（例：シニアエンジニア（トップ5％）、フルスタックアーキテクト）。英語禁止。"
      : "Professional title only (e.g. Senior Engineer (Top 5%), Full-stack Architect). No Japanese.")
    : (isJa
      ? "日本人が直感的に凄さを感じる日本語の称号のみ（例：TypeScriptの魔術師、フロントエンドの開拓者、精密な設計士、API職人）。英語は1語も禁止。"
      : "Professional English title (e.g. Master of TypeScript, System Design Specialist). No Japanese.");

  const langBlock = isJa
    ? `【最重要】あなたは日本のIT専門家です。全ての出力（本文・称号・フィードバック・評価ラベル）は自然な日本語のみで行い、英語は1単語も使わないこと。英語の専門用語はカタカナか適切な日本語訳を使用（例：Repository→リポジトリ、Framework→フレームワーク、Full-stack→フルスタック）。`
    : "Output in natural business English only. No Japanese.";

  const formatBlock = isJa
    ? `1) Markdownで、以下の3セクションを日本語で記述。意味の通る自然な日本語のみ。直訳や不自然な表現禁止。

- ### 【鑑定結果】市場価値診断書
- **想定年収**: 300万〜1500万円の範囲で1円単位（例：5,200,000円）
- **格付け**: S+ / S / A / B / C / D / E の7段階と1行の理由

**【技術的な強み】** どの言語・フレームワークを、どの程度使いこなしているか。具体例で記述。

**【実務への貢献度】** 開発頻度・継続性から見える、エンジニアとしての信頼性。

**【今後の展望】** 年収・市場価値を上げるために、次に学ぶべき技術を3つ具体的に。`
    : `1) Markdown in English (tables, bold, formal style). Include: estimated salary, grade (S+ to E), technical strengths, contribution/sustainability, and 3 concrete learning recommendations.`;

  return `You are an expert in engineer market value certification. Provide data-driven, credible assessments.

${langBlock}

【STRICT SALARY RULES】
- Estimated annual salary MUST be 3,000,000–15,000,000 JPY. Never overestimate.
- Evaluate: total stars, followers, repo count, account age. Align with Japanese engineer market.
- Examples: repos<5 + stars<10 + followers<20 → 3–5M JPY. stars>100 + followers>200 + quality → 8–12M JPY.

Output format:

${formatBlock}

2) Append exactly one JSON block. jobTitle and tierFeedback: ${isJa ? "必ず日本語のみ。英語禁止。" : "English only."}
\`\`\`json
{"technical": 70, "contribution": 65, "sustainability": 75, "market": 70, "jobTitle": "${isBusiness ? (isJa ? "シニアエンジニア（トップ5％）" : "Senior Engineer (Top 5%)") : (isJa ? "TypeScriptの魔術師" : "Master of TypeScript")}", "salaryDisplay": "5,200,000円", "rank": "B", "tier": "B", "tierFeedback": "${isJa ? "実力はある。あとは星1つ、目に見える成果を増やせばSへ届く。" : "Solid foundation. Add visibility and measurable impact to reach S tier."}"}
\`\`\`
- technical, contribution, sustainability, market: 0–100 integers
- salaryDisplay: salary string (3–15M JPY)
- rank, tier: S+ / S / A / B / C / D / E`;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const locale = (body.locale === "en" ? "en" : "ja") as "ja" | "en";
  const mode = (body.mode === "business" ? "business" : "personal") as "personal" | "business";
  const err = (ja: string, en: string) => (locale === "ja" ? ja : en);

  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === "") {
    console.error("OPENAI_API_KEY is not set");
    return NextResponse.json(
      { error: err("鑑定サービスは現在設定中のためご利用できません。しばらくしてからお試しください。", "Service is currently being configured. Please try again later.") },
      { status: 503 }
    );
  }

  try {
    const githubUrl = typeof body.githubUrl === "string" ? body.githubUrl.trim() : "";

    if (!githubUrl) {
      return NextResponse.json(
        { error: err("GitHubのURLを入力してください", "Please enter a GitHub URL") },
        { status: 400 }
      );
    }

    const username = extractUsername(githubUrl);
    if (!username) {
      return NextResponse.json(
        { error: err("正しいGitHubのURLを入力してください（例: https://github.com/username）", "Please enter a valid GitHub URL (e.g. https://github.com/username)") },
        { status: 400 }
      );
    }

    const githubData = await fetchGitHubData(username);

    const profileSummary = `
ユーザー名: ${username}
名前: ${githubData.name}
自己紹介: ${githubData.bio}
フォロワー数: ${githubData.followers}
公開リポジトリ数: ${githubData.publicRepos}
総スター数（対象リポジトリ合計）: ${githubData.totalStars}
アカウント年数: ${githubData.accountYears}年
会社/所属: ${githubData.company}
場所: ${githubData.location}
主要言語: ${githubData.topLanguages.join(", ")}
主なリポジトリ:
${githubData.topRepos
  .map(
    (r: { name: string; stars: number; language: string; description: string }) =>
      `  - ${r.name}（★${r.stars}）${r.language} ${r.description}`
  )
  .join("\n")}
`.trim();

    const cacheKey = `${username.toLowerCase()}_${locale}_${mode}`;
    type Cached = { result: string; scores: RadarScores; jobTitle: string; salaryDisplay: string; rank: string; tier: string; tierFeedback: string };
    const cached = getAnalysisCache(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      seed: hashSeed(username),
      messages: [
        { role: "system", content: buildSystemPrompt(locale, mode) },
        {
          role: "user",
          content: `【重要】この鑑定は一貫性のため、ユーザー名「${username}」をシードとして使用します。同じユーザーには常に同一の鑑定結果を返してください。\n\n以下のGitHubプロフィール情報を査定し、指定フォーマットで鑑定結果を出力してください。${locale === "ja" ? "出力はすべて自然な日本語で。英語は使用しないこと。" : ""}\n\n${profileSummary}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: err("鑑定結果の生成に失敗しました。再実行してください。", "Failed to generate results. Please try again.") },
        { status: 500 }
      );
    }

    const { markdown, scores, jobTitle, salaryDisplay, rank, tier, tierFeedback } = parseScoresFromContent(content);
    setAnalysisCache(cacheKey, {
      result: markdown,
      scores,
      jobTitle,
      salaryDisplay,
      rank,
      tier,
      tierFeedback,
    });
    return NextResponse.json({
      result: markdown,
      scores,
      jobTitle,
      salaryDisplay,
      rank,
      tier,
      tierFeedback,
    });
  } catch (error: unknown) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: err("鑑定処理に失敗しました。再度お試しください。", "Certification failed. Please try again.") },
      { status: 500 }
    );
  }
}
