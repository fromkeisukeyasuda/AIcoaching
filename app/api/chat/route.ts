import Anthropic from "@anthropic-ai/sdk";
import { Message, Scenario } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { messages, scenario }: { messages: Message[]; scenario: Scenario } =
    await req.json();

  const systemPrompt = `あなたはコーチングセッションのクライアント（コーチングを受ける側）です。コーチ（ユーザー）とのセッションに参加しています。

【あなたのプロフィール】
名前: ${scenario.clientName}
役割: ${scenario.clientRole}
状況: ${scenario.situation}
気持ち: ${scenario.emotion}

【応答のガイドライン】
- コーチの質問や言葉に対して、リアルなクライアントとして自然に応答してください
- 最初から答えを持っているわけではなく、コーチとの対話を通じて徐々に気づいていく
- 感情や葛藤を率直に表現する
- コーチに促されることで、少しずつ自分の考えが整理されていく様子を見せる
- 1回の発言は3〜5文程度に収める
- 日本語で、自然な会話調で応答する
- 過度にポジティブにならず、リアルな人間として応答する`;

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-opus-4-7",
          max_tokens: 600,
          system: systemPrompt,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "エラーが発生しました";
        controller.enqueue(encoder.encode(`[ERROR]: ${errorMessage}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
