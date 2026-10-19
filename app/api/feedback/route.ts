import { completeJson } from "@/lib/json";
import { Message, Scenario, UtteranceFeedback } from "@/types";

export const maxDuration = 120; // 発言が多いと時間がかかる（発言をまとめて、並行して評価する）

const CHUNK = 4; // 1回のAI呼び出しで評価する発言の数

interface RawItem {
  index?: number;
  score?: number;
  headline?: string;
  goods?: { title?: string; body?: string }[];
  improves?: { title?: string; body?: string }[];
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const points = (v: RawItem["goods"]) =>
  (Array.isArray(v) ? v : [])
    .map((p) => ({ title: str(p?.title), body: str(p?.body) }))
    .filter((p) => p.title || p.body)
    .slice(0, 3);

function normalize(raw: RawItem, allowed: Set<number>): UtteranceFeedback | null {
  if (typeof raw.index !== "number" || !allowed.has(raw.index)) return null;
  const score = Math.round(Number(raw.score));
  if (!Number.isFinite(score)) return null;
  return {
    index: raw.index,
    score: Math.max(0, Math.min(100, score)),
    headline: str(raw.headline),
    goods: points(raw.goods),
    improves: points(raw.improves),
  };
}

export async function POST(req: Request) {
  const { messages, scenario }: { messages: Message[]; scenario: Scenario } = await req.json();

  if (!Array.isArray(messages) || !scenario) {
    return Response.json({ error: "会話の記録がありません。" }, { status: 400 });
  }

  // 最初の発言は、アプリが自動で送る挨拶なので、評価しない
  const targets = messages
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => m.role === "user" && i > 0 && m.content.trim())
    .map(({ i }) => i);

  if (targets.length === 0) {
    return Response.json({ error: "評価できる発言がありません。もう少し会話してから、お試しください。" }, { status: 400 });
  }

  const conversation = messages
    .map((m, i) => `[#${i}] ${m.role === "user" ? "コーチ" : scenario.clientName}: ${m.content}`)
    .join("\n\n");

  const chunks: number[][] = [];
  for (let i = 0; i < targets.length; i += CHUNK) chunks.push(targets.slice(i, i + CHUNK));

  const evaluate = async (indexes: number[]): Promise<UtteranceFeedback[]> => {
    const prompt = `あなたは、コーチングを教えるトレーナーです。コーチ役（練習している人）の発言を1つずつ評価してください。

【相談者】${scenario.clientName}（${scenario.clientRole}）
【状況】${scenario.situation}

【会話（[#番号] は発言の識別番号）】
${conversation}

【評価する発言】コーチの発言のうち、次の番号だけ: ${indexes.map((n) => `#${n}`).join("、")}

【評価のしかた】
- 発言ごとに、その直前の相談者の言葉をどう受け止め、どう返せたかを見る
- 採点は100点満点。甘くしすぎず、傾聴・承認・要約・オープンな質問・問いの深さなどの観点で、発言の質に応じて差をつける（短い相づちだけなら低め、核心を捉えた返しなら90点台）
- headline: その発言への総評を、1〜2文で。まず、受け止められていた点を認める書き方にする
- goods（良かった点）: 1〜2個。title は、何ができていたかを短い名詞句で（例: 「専門性への誇りと現状のギャップの受容」）。body は、コーチ自身の言葉を「」で引用しながら、なぜ良いかを1〜2文で
- improves（さらに完成度を高めるためのポイント）: 1個。title は、気をつける点を短く。body は、相談者の言葉に触れながら、次にこう聞くとよい、という問いかけの例を「」で添える。ほぼ完璧な発言でも、さらに深める視点を1つ挙げる
- すべて日本語。見出し記号やMarkdownは使わない

次のJSON形式のみで返答してください（他のテキストは一切含めないこと）:
{
  "items": [
    {
      "index": ${indexes[0]},
      "score": 85,
      "headline": "発言への総評",
      "goods": [ { "title": "良かった点の見出し", "body": "理由の説明" } ],
      "improves": [ { "title": "高めるポイントの見出し", "body": "具体的な問いの例を含む説明" } ]
    }
  ]
}
items は、評価する発言の数（${indexes.length}個）だけ、番号の順に並べること。`;

    const data = await completeJson<{ items?: RawItem[] }>({ role: "eval", prompt, maxTokens: 3500 });
    const allowed = new Set(indexes);
    return (data.items ?? []).map((r) => normalize(r, allowed)).filter((x): x is UtteranceFeedback => x !== null);
  };

  try {
    const results = (await Promise.all(chunks.map(evaluate))).flat();
    // 同じ番号が重なったら、最初のものを使い、番号の順に並べる
    const byIndex = new Map<number, UtteranceFeedback>();
    for (const r of results) if (!byIndex.has(r.index)) byIndex.set(r.index, r);
    const items = [...byIndex.values()].sort((a, b) => a.index - b.index);
    if (items.length === 0) throw new Error("発言ごとの評価を作れませんでした。もう一度お試しください。");
    return Response.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "発言ごとの評価を作れませんでした。";
    return Response.json({ error: message }, { status: 500 });
  }
}
