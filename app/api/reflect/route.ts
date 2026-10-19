import { completeJson } from "@/lib/json";
import { Message, Scenario } from "@/types";
import { sheetInstructions, SHEET_JSON_EXAMPLE, normalizeSheet } from "@/lib/sheet";


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
    const sheet = normalizeSheet(await completeJson({ role: "eval", prompt, maxTokens: 4500 }));
    if (!sheet) throw new Error("シートの形式が正しくありません");
    return Response.json(sheet);
  } catch (error) {
    const message = error instanceof Error ? error.message : "シートの作成に失敗しました";
    return Response.json({ error: message }, { status: 500 });
  }
}
