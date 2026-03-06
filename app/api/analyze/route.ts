import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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
  for (const repo of repos) {
    if (repo.language) {
      languages[repo.language] = (languages[repo.language] || 0) + 1;
    }
  }

  return {
    name: user.name || username,
    bio: user.bio || "なし",
    followers: user.followers,
    publicRepos: user.public_repos,
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

function parseScoresFromContent(content: string): { markdown: string; scores: RadarScores } {
  const jsonBlock = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlock) {
    const markdown = content.replace(/\s*```json[\s\S]*?```\s*$/, "").trim();
    try {
      const parsed = JSON.parse(jsonBlock[1].trim()) as Record<string, number>;
      const scores: RadarScores = {
        technical: Math.min(100, Math.max(0, Number(parsed.technical) || DEFAULT_SCORES.technical)),
        contribution: Math.min(100, Math.max(0, Number(parsed.contribution) || DEFAULT_SCORES.contribution)),
        sustainability: Math.min(100, Math.max(0, Number(parsed.sustainability) || DEFAULT_SCORES.sustainability)),
        market: Math.min(100, Math.max(0, Number(parsed.market) || DEFAULT_SCORES.market)),
      };
      return { markdown, scores };
    } catch {
      return { markdown: content.trim(), scores: DEFAULT_SCORES };
    }
  }
  return { markdown: content.trim(), scores: DEFAULT_SCORES };
}

const SYSTEM_PROMPT = `あなたは年収1000万超えを狙うハイエンドエンジニア専用の査定エンジンです。高額キャリアコンサルタントとして、データに基づいた冷徹で説得力のある鑑定を行います。

必ず以下の形式で出力してください。

1) 日本語のMarkdown（表・太字を多用し、公式な鑑定書のような見た目）
- **見出し**: ### 【鑑定結果】市場価値診断書 から始める
- **想定年収**: 1円単位で提示（例: 12,345,678円）
- **技術力**: S / A / B / C / D の5段階で判定し、理由を1行で
- **技術スタック・GitHub活動・市場需給**: 箇条書きで簡潔に分析
- **あと300万上げるために習得すべき技術**: 3つを具体的に提示
- 全体は200〜300文字程度の高密度な情報に凝縮。励ましや曖昧な表現は使わず、事実とデータに基づいたプロフェッショナルな口調で。

2) 最後に、以下のJSONブロックを必ず1つだけ付けてください（数値は0〜100の整数）。レーダーチャート用です。
\`\`\`json
{"technical": 85, "contribution": 70, "sustainability": 80, "market": 75}
\`\`\`
- technical: 技術力（スキル・実装力）
- contribution: 貢献度（OSS・レビュー・コミット）
- sustainability: 継続力（活動の持続性・一貫性）
- market: 市場性（需要・希少性・年収レンジとの相性）`;

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

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `以下のGitHubプロフィール情報を査定し、指定フォーマットで鑑定結果を出力してください:\n\n${profileSummary}`,
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

    const { markdown, scores } = parseScoresFromContent(content);
    return NextResponse.json({ result: markdown, scores });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "査定に失敗しました";
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
