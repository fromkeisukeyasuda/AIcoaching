import Anthropic from "@anthropic-ai/sdk";
import { Message, Scenario, EvaluationResult } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const {
    messages,
    scenario,
    previousImprovements = [],
  }: { messages: Message[]; scenario: Scenario; previousImprovements?: string[] } =
    await req.json();

  const conversation = messages
    .map((m) => `${m.role === "user" ? "コーチ" : scenario.clientName}: ${m.content}`)
    .join("\n\n");

  const hasPrev = previousImprovements.length > 0;

  const prevSection = hasPrev
    ? `\n【前回セッションの改善点（今回のセッションで対応できたか必ず確認すること）】\n${previousImprovements
        .map((item, i) => `${i + 1}. ${item}`)
        .join("\n")}\n`
    : "";

  const prevJsonField = hasPrev
    ? `,\n  "previousImprovementsReview": [\n${previousImprovements
        .map(
          (item) =>
            `    { "item": ${JSON.stringify(item)}, "addressed": true, "comment": "今回の対応についての具体的なコメント" }`
        )
        .join(",\n")}\n  ]`
    : "";

  const prompt = `以下のコーチングセッションの会話を分析し、コーチのスキルを評価してください。

【セッション情報】
クライアント: ${scenario.clientName}（${scenario.clientRole}）
シナリオ: ${scenario.description}
${prevSection}
【会話内容】
${conversation}

【評価基準】
1. 傾聴力: クライアントの言葉をしっかり聞き、理解を示せているか
2. 質問力: オープンクエスチョンや深掘り質問を効果的に使えているか
3. 共感力: クライアントの感情に寄り添い、安心感を与えられているか
4. 目標設定支援: クライアントが自分の目標を明確にする手助けができているか
5. アクション促進: 具体的な行動につながる対話ができているか

以下のJSON形式のみで返答してください（他のテキストは一切含めないこと）:
{
  "overallScore": 75,
  "summary": "全体的な評価の要約（2〜3文）",
  "scores": [
    { "category": "傾聴力", "score": 8, "maxScore": 10, "feedback": "具体的なフィードバック" },
    { "category": "質問力", "score": 7, "maxScore": 10, "feedback": "具体的なフィードバック" },
    { "category": "共感力", "score": 8, "maxScore": 10, "feedback": "具体的なフィードバック" },
    { "category": "目標設定支援", "score": 6, "maxScore": 10, "feedback": "具体的なフィードバック" },
    { "category": "アクション促進", "score": 6, "maxScore": 10, "feedback": "具体的なフィードバック" }
  ],
  "strengths": ["強みの具体例1", "強みの具体例2", "強みの具体例3"],
  "improvements": ["改善点の具体例1", "改善点の具体例2"],
  "nextSteps": "次の練習に向けた具体的なアドバイス（2〜3文）"${prevJsonField}
}`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("JSONの解析に失敗しました");
    }

    const result: EvaluationResult = JSON.parse(jsonMatch[0]);

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "評価の取得に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
