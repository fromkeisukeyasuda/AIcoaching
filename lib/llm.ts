/* AIの切り替え（サーバー側のみ）
   環境変数で、会話用(chat)と評価用(eval)に、別々のAIを選べる。

     AI_CHAT_MODEL = anthropic                      （既定: claude-sonnet-5-5）
     AI_CHAT_MODEL = anthropic:claude-haiku-5-5
     AI_CHAT_MODEL = gemini                         （既定: gemini-2.5-flash）
     AI_CHAT_MODEL = gemini:gemini-2.5-flash
     AI_EVAL_MODEL = ...                            （評価・振り返りシート用。geminiの既定は gemini-2.5-pro）
     AI_MODEL      = ...                            （上の2つが未設定のときの共通設定）

   キー: ANTHROPIC_API_KEY / GEMINI_API_KEY（GOOGLE_API_KEY でも可）
   どれも未設定なら、従来どおり anthropic の claude-sonnet-5-5 を使う。 */
import Anthropic from "@anthropic-ai/sdk";

export type LlmRole = "chat" | "eval";
export type Provider = "anthropic" | "gemini";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmTarget {
  provider: Provider;
  model: string;
}

const DEFAULT_MODELS: Record<Provider, Record<LlmRole, string>> = {
  anthropic: { chat: "claude-sonnet-5-5", eval: "claude-sonnet-5-5" },
  gemini: { chat: "gemini-2.5-flash", eval: "gemini-2.5-pro" },
};

/** 環境変数から、使うAIとモデルを決める */
export function resolveTarget(role: LlmRole): LlmTarget {
  const raw =
    (role === "chat" ? process.env.AI_CHAT_MODEL : process.env.AI_EVAL_MODEL)?.trim() ||
    process.env.AI_MODEL?.trim() ||
    "anthropic";
  const [p, ...rest] = raw.split(":");
  const provider = p.trim().toLowerCase();
  if (provider !== "anthropic" && provider !== "gemini") {
    throw new Error(`AI の設定が正しくありません: "${raw}"（anthropic または gemini を指定してください）`);
  }
  const model = rest.join(":").trim() || DEFAULT_MODELS[provider][role];
  return { provider, model };
}

/* ───────── Anthropic ───────── */
let anthropicClient: Anthropic | null = null;
const anthropic = () => (anthropicClient ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));

/* ───────── Gemini（REST。新しい部品は使わない） ───────── */
function geminiBase() {
  return (process.env.GEMINI_API_BASE?.trim() || "https://generativelanguage.googleapis.com/v1beta").replace(/\/+$/, "");
}
function geminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!key) throw new Error("GEMINI_API_KEY が設定されていません。");
  return key;
}

interface GeminiPart { text?: string; thought?: boolean }
interface GeminiChunk {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

function geminiBody(opts: { model: string; role: LlmRole; system?: string; messages: LlmMessage[]; maxTokens: number; json?: boolean }) {
  const generationConfig: Record<string, unknown> = {};
  const flash = /flash/i.test(opts.model);
  if (opts.role === "chat" && flash) {
    // 会話は、考える時間を使わない（速く、安く）
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
    generationConfig.maxOutputTokens = opts.maxTokens;
  } else {
    // 考える分の出力も、上限に数えられるので、余裕を持たせる
    generationConfig.maxOutputTokens = opts.maxTokens + 4096;
  }
  if (opts.json) generationConfig.responseMimeType = "application/json";
  return {
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    contents: opts.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig,
  };
}

const geminiText = (chunk: GeminiChunk) =>
  (chunk.candidates?.[0]?.content?.parts ?? []).filter((p) => !p.thought).map((p) => p.text ?? "").join("");

async function geminiError(res: Response): Promise<Error> {
  const body = await res.text().catch(() => "");
  return new Error(`${res.status} Gemini API error: ${body.slice(0, 300)}`);
}

async function* geminiStream(opts: Parameters<typeof geminiBody>[0]): AsyncGenerator<string> {
  const res = await fetch(`${geminiBase()}/models/${opts.model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
    body: JSON.stringify(geminiBody(opts)),
  });
  if (!res.ok || !res.body) throw await geminiError(res);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let produced = false;
  let blocked: string | undefined;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const chunk = JSON.parse(data) as GeminiChunk;
        blocked ??= chunk.promptFeedback?.blockReason ?? (chunk.candidates?.[0]?.finishReason === "SAFETY" ? "SAFETY" : undefined);
        const t = geminiText(chunk);
        if (t) { produced = true; yield t; }
      } catch { /* 壊れた行は読み飛ばす */ }
    }
  }
  if (!produced && blocked) throw new Error(`AI が内容をブロックしました（${blocked}）。別の言い方で、もう一度お試しください。`);
}

async function geminiComplete(opts: Parameters<typeof geminiBody>[0]): Promise<string> {
  const res = await fetch(`${geminiBase()}/models/${opts.model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
    body: JSON.stringify(geminiBody(opts)),
  });
  if (!res.ok) throw await geminiError(res);
  const chunk = (await res.json()) as GeminiChunk;
  const text = geminiText(chunk);
  if (!text && chunk.promptFeedback?.blockReason) {
    throw new Error(`AI が内容をブロックしました（${chunk.promptFeedback.blockReason}）。`);
  }
  return text;
}

/* ───────── 共通の入口 ───────── */

/** 会話用: テキストを少しずつ返す */
export async function* streamChat(opts: {
  role?: LlmRole;
  system: string;
  messages: LlmMessage[];
  maxTokens: number;
}): AsyncGenerator<string> {
  const role = opts.role ?? "chat";
  const { provider, model } = resolveTarget(role);

  if (provider === "gemini") {
    yield* geminiStream({ model, role, system: opts.system, messages: opts.messages, maxTokens: opts.maxTokens });
    return;
  }

  const stream = anthropic().messages.stream({
    model,
    max_tokens: opts.maxTokens,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });
  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      yield chunk.delta.text;
    }
  }
}

/** 評価・シート作成用: 全文を、まとめて返す（json: true でJSON出力を強める） */
export async function completeText(opts: {
  role?: LlmRole;
  system?: string;
  prompt: string;
  maxTokens: number;
  json?: boolean;
}): Promise<string> {
  const role = opts.role ?? "eval";
  const { provider, model } = resolveTarget(role);
  const messages: LlmMessage[] = [{ role: "user", content: opts.prompt }];

  if (provider === "gemini") {
    return geminiComplete({ model, role, system: opts.system, messages, maxTokens: opts.maxTokens, json: opts.json });
  }

  const response = await anthropic().messages.create({
    model,
    max_tokens: opts.maxTokens,
    ...(opts.system ? { system: opts.system } : {}),
    messages,
  });
  // 思考ブロックが先頭に来ることがあるため、テキストブロックをすべて連結する
  return response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
}
