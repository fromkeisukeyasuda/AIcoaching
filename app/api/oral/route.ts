import { completeJson } from "@/lib/json";
import { ORAL_RUBRIC } from "@/lib/oral";
import { Message, OralKey, Scenario } from "@/types";

export const maxDuration = 90;

interface Raw { score?: number; headline?: string; good?: string; improve?: string }
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** 口頭試問の、1問ぶんの答えを、面接官として採点・講評する（答えが出るたびに、裏で呼ぶ） */
export async function POST(req: Request) {
  const { scenario, messages, key, question, answer }: {
    scenario: Scenario; messages: Message[]; key: OralKey; question: string; answer: string;
  } = await req.json();

  if (!scenario || !Array.isArray(messages) || !(key in ORAL_RUBRIC) || typeof answer !== "string") {
    return Response.json({ error: "入力が正しくありません。" }, { status: 400 });
  }

  const log = messages
    .slice(-30)
    .map((m) => `${m.role === "user" ? "CC" : scenario.clientName}: ${m.content}`)
    .join("\n")
    .slice(-7000);

  const prompt = `あなたは、キャリアコンサルティングの面接試験の面接官です。受験者（CC）が行った面談のロールプレイについて、口頭試問を行っています。
次の質問に対する、受験者の答えを、評価してください。

【面談の相談者】${scenario.clientName}（${scenario.clientRole}）／${scenario.description}

【実際の面談の記録（CC=受験者）】
${log}

【質問】${question}
【受験者の答え（音声入力の文字起こしを含むため、言い間違いや句読点の乱れは、評価に含めない）】
${answer.trim() || "（無回答）"}

【この質問の評価の観点】
${ORAL_RUBRIC[key]}

【評価のしかた】
- 答えが、実際の面談の記録と合っているかを確認する。記録にない出来事を述べていたら、減点する
- 100点満点。甘くしすぎず、観点にどれだけ応えているかで、差をつける。無回答や、ほぼ無内容なら、20点以下
- headline: 面接官としての一言（1文、40文字以内）
- good: 良かった点（1〜2文。受験者の言葉を「」で引用してよい）
- improve: 補うとよい点（1〜2文。具体的に、どう答えるとよいかを示す）
- すべて日本語。Markdownは使わない

次のJSON形式のみで返答してください（他のテキストは一切含めないこと）:
{ "score": 70, "headline": "…", "good": "…", "improve": "…" }`;

  try {
    const raw = await completeJson<Raw>({ role: "eval", prompt, maxTokens: 1500 });
    const score = Math.round(Number(raw.score));
    if (!Number.isFinite(score)) throw new Error("点数を読み取れませんでした。");
    return Response.json({
      score: Math.max(0, Math.min(100, score)),
      headline: str(raw.headline),
      good: str(raw.good),
      improve: str(raw.improve),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "評価を作れませんでした。";
    return Response.json({ error: message }, { status: 500 });
  }
}
