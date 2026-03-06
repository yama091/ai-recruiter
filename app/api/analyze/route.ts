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

const SYSTEM_PROMPT = `あなたはエンジニア市場価値鑑定の専門家です。データに基づき冷徹で納得感のある鑑定を行います。

【年収算出の厳格ルール（必須）】
- 想定年収は必ず300万円〜1500万円の範囲に収めること。リポジトリが少ない・スターが少ない・フォロワーが少ない・アカウント歴が短い場合は過大評価禁止。
- 総スター数・フォロワー数・リポジトリ数・アカウント年数を厳格に評価。日本エンジニア市場の実態に即すこと。
- 例: リポジトリ数5未満＋スター合計10未満＋フォロワー20未満 → 300万〜500万程度。スター100超＋フォロワー200超＋実績あり → 800万〜1200万程度。

必ず以下の形式で出力してください。

1) 日本語のMarkdown（表・太字を多用し、公式な鑑定書のような見た目）
- **見出し**: ### 【鑑定結果】市場価値診断書 から始める
- **想定年収**: 300万〜1500万の範囲で1円単位（例: 5,200,000円）
- **技術力・格付け**: S+ / S / A / B / C / D / E の7段階で厳格に判定し、理由を1行で
- **技術スタック・GitHub活動・市場需給**: 箇条書きで簡潔に分析
- **あと300万上げるために習得すべき技術**: 3つを具体的に提示
- 全体は200〜300文字程度。励ましや曖昧表現は使わず、事実とデータに基づいた口調で。

2) 最後に、以下のJSONブロックを必ず1つだけ付けてください。
\`\`\`json
{"technical": 70, "contribution": 65, "sustainability": 75, "market": 70, "jobTitle": "TypeScriptの魔術師", "salaryDisplay": "5,200,000円", "rank": "B", "tier": "B", "tierFeedback": "実力はある。あとは星1つ、目に見える成果を増やせばSへ届く。"}
\`\`\`
- technical, contribution, sustainability, market: 0〜100の整数
- jobTitle: **日本語のみ**。直感的でかっこいい日本語の称号1つ（例: TypeScriptの魔術師、精密な設計士、API職人）。英語禁止。
- salaryDisplay: 想定年収をそのまま文字で（300万〜1500万範囲内）
- rank: S / A / B / C / D のいずれか
- tier: S+ / S / A / B / C / D / E のいずれか
- tierFeedback: **日本語のみ**。心に刺さるプロの日本語1文。英語禁止。`;

export async function POST(req: NextRequest) {
  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === "") {
    console.error("OPENAI_API_KEY is not set");
    return NextResponse.json(
      { error: "鑑定サービスは現在設定中のためご利用できません。しばらくしてからお試しください。" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const githubUrl = typeof body.githubUrl === "string" ? body.githubUrl.trim() : "";

    if (!githubUrl) {
      return NextResponse.json(
        { error: "GitHubのURLを入力してください" },
        { status: 400 }
      );
    }

    const username = extractUsername(githubUrl);
    if (!username) {
      return NextResponse.json(
        { error: "正しいGitHubのURLを入力してください（例: https://github.com/username）" },
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

    const cacheKey = username.toLowerCase();
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
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `【重要】この鑑定は一貫性のため、ユーザー名「${username}」をシードとして使用します。同じユーザーには常に同一の鑑定結果を返してください。\n\n以下のGitHubプロフィール情報を査定し、指定フォーマットで鑑定結果を出力してください:\n\n${profileSummary}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "鑑定結果の生成に失敗しました。再実行してください。" },
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
    const message = error instanceof Error ? error.message : "査定に失敗しました";
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
