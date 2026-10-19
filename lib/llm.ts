/* AIの切り替え（サーバー側のみ）
   環境変数で、会話用(chat)と評価用(eval)に、別々のAIを選べる。

     AI_CHAT_MODEL = anthropic                      （既定: claude-sonnet-5-5）
     AI_CHAT_MODEL = anthropic:claude-haiku-5-5
     AI_CHAT_MODEL = gemini                         （既定: gemini-3.8-flash）
     AI_CHAT_MODEL = gemini:gemini-3.8-flash
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
  gemini: { chat: "gemini-3.8-flash", eval: "gemini-2.5-pro" }, // 使えない旧モデルは、APIが勧める新しいモデルに自動で切り替える
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

/** 出力の上限に達して、返答が途中で切れたとき */
export class LlmTruncatedError extends Error {
  constructor() {
    super("AIの返答が長すぎて、途中で切れました。");
    this.name = "LlmTruncatedError";
  }
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

type GeminiOpts = { model: string; role: LlmRole; system?: string; messages: LlmMessage[]; maxTokens: number; json?: boolean; dropThinking?: boolean };

function geminiBody(opts: GeminiOpts) {
  const generationConfig: Record<string, unknown> = {};
  const flash = /flash/i.test(opts.model);
  if (opts.role === "chat" && flash && !opts.dropThinking) {
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

/** 「このモデルは使えなくなった」と言われたモデル → APIが勧める新しいモデル（同じ実行中は、覚えておく） */
const MODEL_REDIRECTS = new Map<string, string>();
/** 「考える設定」を受け付けなかったモデル（同じ実行中は、最初から付けない） */
const NO_THINKING_CONFIG = new Set<string>();

/** エラー文に出てくる「models/gemini-…」のうち、いま使っているもの以外の、最後のものを選ぶ */
function recommendedModel(body: string, current: string): string | null {
  const names = [...body.matchAll(/models\/(gemini-[A-Za-z0-9._-]+)/g)].map((m) => m[1]).filter((n) => n !== current);
  return names.length ? names[names.length - 1] : null;
}

/** Geminiを呼ぶ。旧モデルが使えないときは、勧められた新しいモデルで、考える設定が拒否されたときは、その設定なしで、やり直す */
async function geminiRequest(opts: GeminiOpts, endpoint: (model: string) => string): Promise<Response> {
  let model = MODEL_REDIRECTS.get(opts.model) ?? opts.model;
  let dropThinking = NO_THINKING_CONFIG.has(MODEL_REDIRECTS.get(opts.model) ?? opts.model);
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${geminiBase()}/models/${endpoint(model)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
      body: JSON.stringify(geminiBody({ ...opts, model, dropThinking })),
    });
    if (res.ok) return res;
    const text = await res.text().catch(() => "");
    if (res.status === 404 && /no longer available|not found|is not supported/i.test(text)) {
      const next = recommendedModel(text, model);
      if (next) {
        console.warn(`[llm] Gemini model ${model} is unavailable; switching to ${next}`);
        MODEL_REDIRECTS.set(opts.model, next);
        model = next;
        dropThinking = NO_THINKING_CONFIG.has(model);
        continue;
      }
    }
    if (res.status === 400 && /thinking/i.test(text) && !dropThinking) {
      console.warn(`[llm] Gemini model ${model} rejected thinkingConfig; retrying without it`);
      dropThinking = true;
      NO_THINKING_CONFIG.add(model);
      continue;
    }
    throw new Error(`${res.status} Gemini API error: ${text.slice(0, 300)}`);
  }
  throw new Error("Gemini API error: モデルを切り替えても、呼び出せませんでした。");
}

async function* geminiStream(opts: GeminiOpts): AsyncGenerator<string> {
  const res = await geminiRequest(opts, (m) => `${m}:streamGenerateContent?alt=sse`);
  if (!res.body) throw new Error("Gemini API error: 返答が空でした。");

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

async function geminiComplete(opts: GeminiOpts): Promise<string> {
  const res = await geminiRequest(opts, (m) => `${m}:generateContent`);
  const chunk = (await res.json()) as GeminiChunk;
  const text = geminiText(chunk);
  if (chunk.candidates?.[0]?.finishReason === "MAX_TOKENS") throw new LlmTruncatedError();
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
  // 思考ブロックも出力の上限に数えられるため、足りないと、本文が途中で切れる
  if (response.stop_reason === "max_tokens") throw new LlmTruncatedError();
  // 思考ブロックが先頭に来ることがあるため、テキストブロックをすべて連結する
  return response.content.map((c) => (c.type === "text" ? c.text : "")).join("");
}
