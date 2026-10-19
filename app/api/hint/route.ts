import { completeText } from "@/lib/llm";
import { Message, Scenario } from "@/types";

export const maxDuration = 60;

/** 練習中の「次の一手」のヒント（コーチ役のユーザー向け）を、短く返す */
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
コーチ役（練習している人）が、次に何を言えばよいか迷っています。直近の会話を読み、次の一手のヒントを出してください。

【相談者】${scenario.clientName}（${scenario.clientRole}）
【状況】${scenario.situation}

【会話】
${log}

【出力のルール】
- 日本語で、全体で2〜3文。見出しやリストは使わない
- 最初の1文で、いま相談者に起きていること（感情・本音の兆し）を短く伝える
- 次の文で、次に試せる関わり方を1つだけ示す（傾聴・承認・オープンな質問・要約など）。そのまま使える問いかけの例を「」で1つ添える
- 答えを教え込まず、相手が自分で気づくための関わりを勧める`;

  try {
    const text = (await completeText({ role: "chat", prompt, maxTokens: 400 })).trim();
    if (!text) throw new Error("empty");
    return Response.json({ hint: text });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ヒントを作れませんでした。";
    return Response.json({ error: message }, { status: 500 });
  }
}
