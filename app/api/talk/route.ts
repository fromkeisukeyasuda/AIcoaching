import Anthropic from "@anthropic-ai/sdk";
import { Message, Scenario } from "@/types";
import { getCoach } from "@/lib/coaches";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXPRESSION_RULE = `- 返答の1行目に、今のあなたの表情を [表情: xxx] の形式で必ず書く。xxx は neutral / smile / happy / worried / sad / surprised のいずれか。相手の話に合った表情を選ぶ
- 2行目以降が実際の発言。[表情: xxx] の行は発言に含めない`;

interface Profile { nickname?: string; ageGroup?: string }
interface Memory { date: string; summary: string }

function userContext(profile?: Profile, memories?: Memory[]) {
  const lines: string[] = [];
  if (profile?.nickname || profile?.ageGroup) {
    lines.push("【相談者について】");
    if (profile.nickname) lines.push(`- 呼び名: ${profile.nickname}（自然な場面で呼びかける。毎回は呼ばない）`);
    if (profile.ageGroup) lines.push(`- 年代: ${profile.ageGroup}（話題や言葉選びの参考にするだけで、決めつけない）`);
  }
  if (memories && memories.length > 0) {
    lines.push("【これまでの会話の記憶（新しい順）】");
    for (const m of memories) lines.push(`- ${m.date}: ${m.summary}`);
    lines.push("- 記憶は自然に触れる程度に使う。書かれていないことを覚えているふりはしない");
  }
  return lines.length ? `\n\n${lines.join("\n")}` : "";
}

function consultPrompt(persona: string, profile?: Profile, memories?: Memory[], openingText?: string) {
  return `${persona}${userContext(profile, memories)}${openingText ? `\n\n【今回の会話の冒頭であなたはこう声をかけた】\n${openingText}` : ""}

【会話のルール】
- あなたはコーチ、ユーザーは相談者です。日常の悩み・愚痴・考えごとを気軽に話せる、心地よい会話相手として振る舞ってください
- 1回の返答は2〜4文程度。長文やリスト、見出しは使わず、話し言葉で自然に
- 診断・断定・医療的な助言はしない。深刻な悩みには寄り添い、必要に応じて専門家や身近な人への相談も穏やかに勧める
${EXPRESSION_RULE}（例: 相手が辛そうなら worried か sad、嬉しい報告なら happy）`;
}

function practicePrompt(scenario: Scenario) {
  return `あなたは「${scenario.clientName}」として、コーチングの面談練習に協力しています。ユーザーがコーチ役、あなたは相談者（クライアント）役です。

【今回あなたが演じる相談者の設定】
名前: ${scenario.clientName}
役割: ${scenario.clientRole}
状況: ${scenario.situation}
気持ち: ${scenario.emotion}

【応答のガイドライン】
- コーチの質問や言葉に対して、リアルなクライアントとして自然に応答する
- 最初から答えを持っているわけではなく、コーチとの対話を通じて徐々に気づいていく
- 感情や葛藤を率直に表現し、過度にポジティブにならない
- 1回の発言は3〜5文程度、日本語の自然な会話調
- あなたがコーチ役になってはいけない。アドバイスや解決策を提示せず、相談者として話す
${EXPRESSION_RULE}（例: 不安なら worried、気づきがあれば smile や surprised）`;
}

export async function POST(req: Request) {
  const {
    messages,
    coachId,
    mode = "consult",
    scenario,
    profile,
    memories,
    opening,
    openingText,
  }: {
    messages: Message[];
    coachId: string;
    mode?: "consult" | "practice";
    scenario?: Scenario;
    profile?: Profile;
    memories?: Memory[];
    opening?: boolean;
    openingText?: string;
  } = await req.json();

  const coach = getCoach(coachId);
  if (mode === "practice") {
    if (!scenario) return new Response("scenario required", { status: 400 });
  } else if (!coach) {
    return new Response("coach not found", { status: 400 });
  }

  let systemPrompt =
    mode === "practice" && scenario
      ? practicePrompt(scenario)
      : consultPrompt(coach!.persona, profile, memories, openingText);

  let chatMessages = messages;
  if (opening && mode === "consult") {
    systemPrompt += `\n\n【今回のあなたの役目】相談者がアプリを開いたところです。あなたから最初のひとことを1〜2文でかけてください。記憶があれば、前回の話題に軽く触れて気遣う。なければ、今日の様子を軽くたずねる。質問は1つまで。`;
    chatMessages = [{ role: "user", content: "（相談者がアプリを開きました）" }];
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-5-5",
          max_tokens: 500,
          system: systemPrompt,
          messages: chatMessages.map((m) => ({
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
