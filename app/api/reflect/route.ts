import Anthropic from "@anthropic-ai/sdk";
import { Message, Scenario } from "@/types";
import { sheetInstructions, SHEET_JSON_EXAMPLE, normalizeSheet } from "@/lib/sheet";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { messages, scenario }: { messages: Message[]; scenario: Scenario } = await req.json();

  const conversation = messages
    .filter((m) => m.content.trim())
    .map((m) => `${m.role === "user" ? "CC" : scenario.clientName}: ${m.content}`)
    .join("\n\n");

  if (!conversation) {
    return Response.json({ error: "会話が空のため、シートを作成できません。" }, { status: 400 });
  }

  const prompt = `以下は、キャリアコンサルティングのロールプレイの会話です。
${sheetInstructions(scenario)}
【会話内容】
${conversation}

次のJSON形式のみで返答してください（他のテキストは一切含めないこと）:
${SHEET_JSON_EXAMPLE}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
    const json = text.match(/\{[\s\S]*\}/)?.[0];
    if (!json) throw new Error("JSONの解析に失敗しました");
    const sheet = normalizeSheet(JSON.parse(json));
    if (!sheet) throw new Error("シートの形式が正しくありません");
    return Response.json(sheet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "シートの作成に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
