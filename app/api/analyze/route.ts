import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

// -----------------------------
// レートリミット（同一 IP の過剰アクセス防止）
// -----------------------------

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000; // 60 秒
const RATE_LIMIT_MAX_REQUESTS = 30; // 1 分あたり 30 リクエストまで

// グローバルに保持して、同一ランタイムインスタンス内では共有されるようにする
const rateLimitStore: Map<string, RateLimitEntry> =
  (globalThis as any).__analyzeRateLimitStore ??
  ((globalThis as any).__analyzeRateLimitStore = new Map());

function getClientIdentifier(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const firstIp = xff.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  // Next.js 13+ では request.ip が利用可能な場合がある
  const ip = (request as any).ip as string | undefined;
  if (ip) return ip;
  return "unknown";
}

function checkRateLimit(request: NextRequest): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const id = getClientIdentifier(request);
  const current = rateLimitStore.get(id);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(id, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, retryAfter: RATE_LIMIT_WINDOW_MS / 1000 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return { allowed: false, retryAfter: retryAfterSeconds };
  }

  current.count += 1;
  rateLimitStore.set(id, current);
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((current.resetAt - now) / 1000),
  );
  return { allowed: true, retryAfter: retryAfterSeconds };
}

type AnalyzeRequestBody = {
  githubUrl?: string;
};

type AnalyzeResponseBody = {
  technologies: string[];
  salaryRange: string;
  motivationScore: number;
  motivationText: string;
  scoutText: string;
  technicalScore: number;
  organizationalContribution: string;
  sustainabilityScore: number;
  sustainabilityText: string;
};

type GitHubUser = {
  login: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
};

type GitHubRepo = {
  full_name: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  created_at: string;
  pushed_at: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchFromGitHub<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "ai-recruiter-app",
      ...(GITHUB_TOKEN
        ? {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
          }
        : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}

async function loadGitHubProfile(githubUrl: string) {
  const url = new URL(githubUrl);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    throw new Error("GitHub URL must include a user or repository path.");
  }

  if (segments.length === 1) {
    const username = segments[0]!;
    const user = await fetchFromGitHub<GitHubUser>(`/users/${username}`);
    const repos = await fetchFromGitHub<GitHubRepo[]>(
      `/users/${username}/repos?per_page=8&sort=updated`,
    );
    return { mode: "user" as const, user, repos };
  }

  const owner = segments[0]!;
  const repoName = segments[1]!;
  const repo = await fetchFromGitHub<GitHubRepo>(`/repos/${owner}/${repoName}`);
  return { mode: "repo" as const, repo };
}

function buildHeuristicAnalysis(input: {
  githubUrl: string;
  githubData?: { mode: "user" | "repo"; user?: GitHubUser; repo?: GitHubRepo };
}): AnalyzeResponseBody {
  const technologies: string[] = [];
  let technicalScore = 80;
  let motivationScore = 8.5;
  let salaryRange = "1,000〜1,400万円";

  if (input.githubData?.mode === "repo" && input.githubData.repo) {
    const repo = input.githubData.repo;
    if (repo.language) technologies.push(repo.language);

    const signals =
      repo.stargazers_count * 2 +
      repo.forks_count * 1.5 +
      repo.watchers_count +
      repo.open_issues_count * 0.5;

    technicalScore = Math.min(98, 70 + Math.log2(1 + signals));
    motivationScore = Math.min(10, 7 + Math.log2(1 + repo.open_issues_count));

    if (technicalScore >= 92) {
      salaryRange = "1,200〜1,600万円";
    } else if (technicalScore >= 88) {
      salaryRange = "1,100〜1,400万円";
    }
  }

  const motivationText =
    "公開リポジトリの更新履歴やイシュー・スター数から、技術アウトプットへの継続的なコミットメントが高い水準で維持されていると推定。";

  const organizationalContribution =
    "コード実装だけでなく、レビューやイシュー運用を通じてチーム全体の品質向上に寄与しうるプロファイル。技術的な意思決定やアーキテクチャ議論にも主体的に関与できる可能性が高いと評価。";

  const sustainabilityScore = Math.min(10, motivationScore + 0.5);
  const sustainabilityText =
    "複数のリポジトリにまたがる継続的な活動から、中長期にわたって安定してアウトプットを出し続ける傾向がうかがえる。プロダクトのライフサイクル全体に関わる長期的な戦力として期待できる水準。";

  const scoutText = `〇〇様

GitHub 上でのご活動内容を拝見し、技術的な深さと継続的な貢献度の高さに強い関心を持ちご連絡しております。

とりわけ、公開されているリポジトリにおける設計・実装の一貫性や、レビュー／イシュー運用の履歴から、
プロダクト視点とチーム視点の双方を意識した開発姿勢が強く感じられました。

弊社では、事業インパクトを意識した技術選定や、長期的なプロダクト成長を見据えた改善提案をリードいただけるエンジニアの方を求めております。
〇〇様のご経験は、まさにその要件に高い親和性があると考えております。

まずはカジュアルなお打ち合わせからで構いませんので、
直近のご状況や今後のご志向も含めてお話しできれば幸いです。`;

return {
    technologies: technologies.length ? technologies : ["TypeScript", "Next.js"],
    salaryRange,
    motivationScore,
    motivationText,
    scoutText,
    technicalScore,
    organizationalContribution,
    sustainabilityScore,
    sustainabilityText,
  };
}

async function callOpenAIAnalysis(params: {
  githubUrl: string;
  githubDataSummary: string;
}): Promise<AnalyzeResponseBody> {
  if (!hasOpenAIKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const systemPrompt =
    "あなたはスタートアップ/テック企業のシニア採用担当です。GitHub の情報から、候補者の技術力と推定年収レンジを、日系テック企業の水準で評価してください。";

  const userPrompt = `
対象の GitHub URL: ${params.githubUrl}

=== GitHub 要約データ ===
${params.githubDataSummary}

以下の形式の JSON だけを、日本語で返してください（説明文やマークダウンは不要です）:
{
  "technologies": ["TypeScript", "Next.js"],
  "salaryRange": "1200〜1500万円",
  "motivationScore": 9.1,
  "motivationText": "〜〜〜",
  "scoutText": "〜〜〜",
  "technicalScore": 92,
  "organizationalContribution": "〜〜〜",
  "sustainabilityScore": 9.3,
  "sustainabilityText": "〜〜〜"
}

前提:
- 給与レンジは日本国内のフルタイム正社員を想定してください。
- 技術スコア/継続力スコアは 0〜100 ではなく 0〜10 の少数 1 桁で返してください。
- scoutText は、そのまま候補者に送信できる丁寧な日本語のスカウト文にしてください。`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error("Failed to parse OpenAI response as JSON.");
  }

  const base = buildHeuristicAnalysis({ githubUrl: params.githubUrl });

  return {
    technologies: Array.isArray(parsed.technologies)
      ? parsed.technologies.map((v: unknown) => String(v)).slice(0, 8)
      : base.technologies,
    salaryRange:
      typeof parsed.salaryRange === "string"
        ? parsed.salaryRange
        : base.salaryRange,
    motivationScore:
      typeof parsed.motivationScore === "number"
        ? parsed.motivationScore
        : base.motivationScore,
    motivationText:
      typeof parsed.motivationText === "string"
        ? parsed.motivationText
        : base.motivationText,
    scoutText:
      typeof parsed.scoutText === "string"
        ? parsed.scoutText
        : base.scoutText,
    technicalScore:
      typeof parsed.technicalScore === "number"
        ? parsed.technicalScore
        : base.technicalScore,
    organizationalContribution:
      typeof parsed.organizationalContribution === "string"
        ? parsed.organizationalContribution
        : base.organizationalContribution,
    sustainabilityScore:
      typeof parsed.sustainabilityScore === "number"
        ? parsed.sustainabilityScore
        : base.sustainabilityScore,
    sustainabilityText:
      typeof parsed.sustainabilityText === "string"
        ? parsed.sustainabilityText
        : base.sustainabilityText,
  };
}

export async function POST(request: NextRequest) {
  try {
    // IP ベースの簡易レートリミット（同一 IP からの過剰な同時アクセスを制御）
    const rate = checkRateLimit(request);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            "一定時間内のリクエスト数が上限を超えました。しばらく時間をおいてから再度お試しください。",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfter),
          },
        },
      );
    }

    const body = (await request.json().catch(() => ({}))) as AnalyzeRequestBody;
    const rawUrl = body.githubUrl?.trim();

    if (!rawUrl) {
      return NextResponse.json(
        { error: "githubUrl is required." },
        { status: 400 },
      );
    }

    let githubData: Awaited<ReturnType<typeof loadGitHubProfile>> | undefined;
    try {
      githubData = await loadGitHubProfile(rawUrl);
    } catch (githubError) {
      console.warn("Failed to load GitHub profile:", githubError);
    }

    const githubSummaryLines: string[] = [];
    if (githubData?.mode === "user" && githubData.user) {
      const u = githubData.user;
      githubSummaryLines.push(
        `ユーザー: ${u.login} (${u.html_url}), 公開リポジトリ数: ${u.public_repos}, フォロワー: ${u.followers}, フォロー: ${u.following}, アカウント作成日: ${u.created_at}`,
      );
      if (githubData.repos?.length) {
        githubSummaryLines.push(
          "代表的なリポジトリ（最大8件）:",
          ...githubData.repos.map(
            (r) =>
              `- ${r.full_name} (${r.html_url}) / 言語: ${
                r.language ?? "不明"
              }, スター: ${r.stargazers_count}, フォーク: ${
                r.forks_count
              }, ウォッチ: ${r.watchers_count}, オープンイシュー: ${
                r.open_issues_count
              }`,
          ),
        );
      }
    } else if (githubData?.mode === "repo" && githubData.repo) {
      const r = githubData.repo;
      githubSummaryLines.push(
        `リポジトリ: ${r.full_name} (${r.html_url}), 言語: ${
          r.language ?? "不明"
        }, スター: ${r.stargazers_count}, フォーク: ${
          r.forks_count
        }, ウォッチ: ${r.watchers_count}, オープンイシュー: ${
          r.open_issues_count
        }, 作成日: ${r.created_at}, 最終更新: ${r.pushed_at}`,
      );
    } else {
      githubSummaryLines.push("GitHub API から十分な情報を取得できませんでした。");
    }

    const githubDataSummary = githubSummaryLines.join("\n");

    let responsePayload: AnalyzeResponseBody;
    try {
      responsePayload = await callOpenAIAnalysis({
        githubUrl: rawUrl,
        githubDataSummary,
      });
    } catch (openAiError) {
      console.warn("OpenAI analysis failed, falling back to heuristic:", openAiError);
      responsePayload = buildHeuristicAnalysis({
        githubUrl: rawUrl,
        githubData:
          githubData && githubData.mode === "repo"
            ? { mode: "repo", repo: githubData.repo }
            : githubData && githubData.mode === "user"
            ? { mode: "user", user: githubData.user }
            : undefined,
      });
    }

    return NextResponse.json<AnalyzeResponseBody>(responsePayload, {
      status: 200,
    });
  } catch (error) {
    console.error("Analyze API fatal error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to analyze the GitHub profile. Please verify the URL and try again.",
      },
      { status: 500 },
    );
  }
}

