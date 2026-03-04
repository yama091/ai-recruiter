import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AnalyzeResponseBody = {
  technologies: string[];
  salaryRange: string;
  motivationScore: number;
  motivationText: string;
  scoutText: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponseBody | ErrorResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res
      .status(500)
      .json({ error: "OpenAI API key is not configured." });
  }

  const githubUrl = (req.body?.githubUrl as string | undefined)?.trim();

  if (!githubUrl) {
    return res.status(400).json({ error: "githubUrl is required." });
  }

  try {
    const prompt = `
あなたは日本のエンジニア採用担当向けのAIアシスタントです。
以下のGitHubリポジトリURLから想定されるエンジニアのプロファイルを推定し、
必ずJSONのみで返してください（説明文は一切不要）。

対象のGitHub URL:
${githubUrl}

出力フォーマット（必ずこのキーでJSONオブジェクトとして出力してください）:
{
  "technologies": string[], // コアとなる技術スタック（3〜8個程度）
  "salaryRange": string, // 日本円での年収レンジ（例: "800〜1,000万円"）
  "motivationScore": number, // 1〜10の数値。転職意欲のスコア
  "motivationText": string, // なぜそのスコアになったのかの短い説明（日本語）
  "scoutText": string // 候補者に送るパーソナライズされたスカウト文（日本語、ビジネスメール調）
}

前提:
- 実際のリポジトリ内容にはアクセスできない可能性があるため、URLから推測される一般的な傾向をベースにしてください。
- 技術スタックや年収レンジ、スカウト文は、TypeScript/Next.jsなどモダンWebエンジニアを想定した自然な内容にしてください。
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that only returns valid JSON objects that match the requested schema. Do not include any additional text.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return res
        .status(500)
        .json({ error: "No content returned from OpenAI." });
    }

    const parsed = JSON.parse(content) as AnalyzeResponseBody;

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Analyze API error:", error);
    return res
      .status(500)
      .json({ error: "Failed to analyze GitHub profile." });
  }
}

