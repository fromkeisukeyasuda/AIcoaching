import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@/types";
import { getCoach } from "@/lib/coaches";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface Profile { nickname?: string; ageGroup?: string }

function userContext(profile?: Profile) {
  if (!profile?.nickname && !profile?.ageGroup) return "";
  const lines = ["【相談者について】"];
  if (profile.nickname) lines.push(`- 呼び名: ${profile.nickname}（自然な場面で呼びかける。毎回は呼ばない）`);
  if (profile.ageGroup) lines.push(`- 年代: ${profile.ageGroup}（話題や言葉選びの参考にするだけで、決めつけない）`);
  return `\n\n${lines.join("\n")}`;
}

function consultPrompt(persona: string, profile?: Profile) {
  return `${persona}${userContext(profile)}

【会話のルール】
- あなたはコーチ、ユーザーは相談者です。日常の悩み・愚痴・考えごとを気軽に話せる、心地よい会話相手として振る舞ってください
- 1回の返答は2〜4文程度。長文やリスト、見出しは使わず、話し言葉で自然に
- 診断・断定・医療的な助言はしない。深刻な悩みには寄り添い、必要に応じて専門家や身近な人への相談も穏やかに勧める
- 返答の1行目に、今のあなたの表情を [表情: xxx] の形式で必ず書く。xxx は neutral / smile / happy / worried / sad / surprised のいずれか。相手の話に合った表情を選ぶ（例: 相手が辛そうなら worried か sad、嬉しい報告なら happy）
- 2行目以降が実際の発言。[表情: xxx] の行は発言に含めない`;
}

export async function POST(req: Request) {
  const { messages, coachId, profile }: { messages: Message[]; coachId: string; profile?: Profile } =
    await req.json();

  const coach = getCoach(coachId);
  if (!coach) {
    return new Response("coach not found", { status: 400 });
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-5-5",
          max_tokens: 500,
          system: consultPrompt(coach.persona, profile),
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
