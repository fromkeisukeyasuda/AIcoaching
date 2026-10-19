import { completeJson } from "@/lib/json";
import { Message, Scenario } from "@/types";

export const maxDuration = 60;

// 表示ボックスの大きさは変えず、スマホで5行ぶん（解説2行・受け止め2行・次の問い1行）に収める
const MAX = { explain: 38, acknowledge: 40, question: 20 } as const;
const TOTAL_MAX = MAX.explain + MAX.acknowledge + MAX.question;

interface RawHint { explain?: string; acknowledge?: string; question?: string }

const clean = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** 長すぎる文は、句点か「」の区切りで切る */
function fit(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("？"), cut.lastIndexOf("」"));
  return end > 10 ? cut.slice(0, end + 1) : cut;
}

/** 練習中の「次の一手」のヒント。基本構成: 発言の解説 → 事実と感情の受け止め → 次の問い */
export async function POST(req: Request) {
  const { messages, scenario }: { messages: Message[]; scenario: Scenario } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0 || !scenario) {
    return Response.json({ error: "会話がまだありません。" }, { status: 400 });
  }

  const log = messages
    .slice(-12)
    .map((m) => `${m.role === "user" ? "コーチ" : scenario.clientName}: ${m.content}`)
    .join("\n");

  const prompt = `あなたは、コーチングの練習を見守るトレーナーです。
コーチ役（練習している人）が、次に何を言えばよいか迷っています。相談者の直近の発言をもとに、次の一手のヒントを出してください。

【相談者】${scenario.clientName}（${scenario.clientRole}）
【状況】${scenario.situation}

【会話】
${log}

【ヒントの基本構成（この3つを、この順で、各1文）】
1. explain（発言の解説）: 相談者の直近の発言の背景にある心理状態を、心理カウンセラーが使う専門用語を1〜2個使って解説する（例: 自己概念、自己不一致、閉塞感、役割葛藤、防衛、価値の条件、内的葛藤、無力感）。断定せず「〜がうかがえる」などの言い方にする
2. acknowledge（事実と感情の受け止め）: 相談者が話した「事実」と「感情」を、コーチがそのまま受け止める言い方。相談者の言葉を使い、「〜という状況で、〜と感じているのですね」の形にする
3. question（次の問い）: 次に投げかけるオープンな質問を1つ。「」でそのまま使える形にする

【ルール】
- 文字数の上限（厳守）: explain は30〜${MAX.explain}文字（短すぎず、専門用語を使って背景まで解説する）、acknowledge は${MAX.acknowledge}文字以内、question は${MAX.question}文字以内。各1文。日本語。見出しやMarkdownは使わない
- 短くするため、前置きや言い換えは省き、核心だけを書く
- 答えを教え込まず、相手が自分で気づくための関わりにする

次のJSON形式のみで返答してください（他のテキストは一切含めないこと）:
{ "explain": "…", "acknowledge": "…", "question": "…" }`;

  try {
    // 長すぎる・欠けているときは、1回だけ作り直す。それでも長ければ、区切りで切る
    let parts = { explain: "", acknowledge: "", question: "" };
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await completeJson<RawHint>({ role: "chat", prompt, maxTokens: 1500 });
      parts = { explain: clean(raw.explain), acknowledge: clean(raw.acknowledge), question: clean(raw.question) };
      const total = parts.explain.length + parts.acknowledge.length + parts.question.length;
      const fits = parts.explain.length <= MAX.explain + 4 && parts.acknowledge.length <= MAX.acknowledge + 6 && parts.question.length <= MAX.question + 4;
      if (parts.explain && parts.acknowledge && parts.question && (fits || total <= TOTAL_MAX)) break;
    }
    if (!parts.explain || !parts.acknowledge || !parts.question) throw new Error("ヒントを作れませんでした。もう一度お試しください。");

    const items = [
      { label: "解説", text: fit(parts.explain, MAX.explain + 4) },
      { label: "受け止め", text: fit(parts.acknowledge, MAX.acknowledge + 6) },
      { label: "次の問い", text: fit(parts.question, MAX.question + 4) },
    ];
    return Response.json({ parts: items, hint: items.map((p) => `${p.label}：${p.text}`).join("\n") });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ヒントを作れませんでした。";
    return Response.json({ error: message }, { status: 500 });
  }
}
