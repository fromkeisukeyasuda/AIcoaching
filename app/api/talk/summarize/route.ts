import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { messages, nickname }: { messages: Message[]; nickname?: string } = await req.json();

  const transcript = messages
    .filter((m) => m.content.trim())
    .map((m) => `${m.role === "user" ? "相談者" : "コーチ"}: ${m.content}`)
    .join("\n");

  if (!transcript) {
    return Response.json({ error: "empty" }, { status: 400 });
  }

  try {
    const res = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 400,
      system: `あなたは会話ログを、相談者本人の日記として残る短い記録にまとめるアシスタントです。
次のJSONだけを出力してください（前後に説明やコードブロックは付けない）。
{"summary": "...", "mood": "...", "topics": ["...", "..."]}
- summary: 相談者${nickname ? `（${nickname}さん）` : ""}の出来事・気持ち・気づきを、2〜3文の日記風（です・ます調は使わない）で。コーチの発言ではなく相談者側を中心に。次回の会話で触れられるよう具体的に
- mood: 会話の中での気持ちの動きを短く（例: 「落ち込み→少し前向き」）
- topics: 話題のキーワードを最大3つ`,
      messages: [{ role: "user", content: transcript }],
    });

    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return Response.json({ error: "parse" }, { status: 502 });
    const parsed = JSON.parse(json) as { summary?: string; mood?: string; topics?: string[] };
    if (!parsed.summary) return Response.json({ error: "parse" }, { status: 502 });

    return Response.json({
      summary: String(parsed.summary),
      mood: String(parsed.mood ?? ""),
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 3).map(String) : [],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "error";
    return Response.json({ error: message }, { status: 500 });
  }
}
