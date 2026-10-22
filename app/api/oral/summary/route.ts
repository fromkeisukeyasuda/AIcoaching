import { completeJson } from "@/lib/json";
import { OralItem, Scenario } from "@/types";

export const maxDuration = 90;

interface Raw { summary?: string; strengths?: unknown; improvements?: unknown; consistency?: string }
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const list = (v: unknown) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, 3) : []);

/** 5問の答えと各問の講評を、まとめて、面接官の総評にする */
export async function POST(req: Request) {
  const { scenario, items }: { scenario: Scenario; items: OralItem[] } = await req.json();

  if (!scenario || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "口頭試問の記録がありません。" }, { status: 400 });
  }

  const body = items
    .map((it, i) => `【${i + 1}】${it.question}\n答え: ${it.answer.trim() || "（無回答）"}\n点数: ${it.score ?? "—"}／講評: ${[it.headline, it.good, it.improve].filter(Boolean).join(" ")}`)
    .join("\n\n");

  const prompt = `あなたは、キャリアコンサルティングの面接試験の面接官です。口頭試問（${items.length}問）が終わりました。各問の答えと講評をもとに、総評をまとめてください。

【面談の相談者】${scenario.clientName}（${scenario.clientRole}）／${scenario.description}

【口頭試問の記録】
${body}

【まとめ方】
- summary: 総評（3〜4文）。まず、良かった点を認め、そのあとに、課題を伝える
- strengths: 強み（2〜3個。各1文）
- improvements: 次に向けた課題（2〜3個。各1文。具体的に）
- consistency: 答えが、一つの筋として、整合していたかの所見（1〜2文）。問いは、できたこと／改善点／主訴／見立て／今後の面談方針のうち、上の記録にあるものだけ
- すべて日本語。Markdownは使わない

次のJSON形式のみで返答してください（他のテキストは一切含めないこと）:
{ "summary": "…", "strengths": ["…"], "improvements": ["…"], "consistency": "…" }`;

  try {
    const raw = await completeJson<Raw>({ role: "eval", prompt, maxTokens: 2000 });
    const scored = items.filter((it) => typeof it.score === "number") as (OralItem & { score: number })[];
    const overall = scored.length ? Math.round(scored.reduce((a, it) => a + it.score, 0) / scored.length) : 0;
    return Response.json({
      overall,
      summary: str(raw.summary),
      strengths: list(raw.strengths),
      improvements: list(raw.improvements),
      consistency: str(raw.consistency),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "総評を作れませんでした。";
    return Response.json({ error: message }, { status: 500 });
  }
}
