import { completeText, LlmTruncatedError } from "@/lib/llm";

/** AIが返したJSONの、よくある崩れ（文字列内の引用符・改行、末尾のカンマ）を直す */
function repairJson(src: string): string {
  let out = "";
  let inStr = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (!inStr) {
      if (ch === '"') inStr = true;
      out += ch;
      continue;
    }
    if (ch === "\\") {
      out += ch + (src[i + 1] ?? "");
      i++;
      continue;
    }
    if (ch === '"') {
      // 文字列の終わりは、後ろが , } ] : のときだけ。それ以外は、文中の引用符として、エスケープする
      const next = src.slice(i + 1).match(/^\s*(.)/)?.[1];
      if (next === undefined || next === "," || next === "}" || next === "]" || next === ":") {
        inStr = false;
        out += ch;
      } else {
        out += '\\"';
      }
      continue;
    }
    if (ch === "\n") { out += "\\n"; continue; }
    if (ch === "\r") continue;
    if (ch === "\t") { out += "\\t"; continue; }
    out += ch;
  }
  return out.replace(/,\s*([}\]])/g, "$1");
}

/** 文章の中から、JSONの塊を取り出して読む。崩れていたら直して、もう一度読む */
export function parseJsonLoose<T = unknown>(text: string): T {
  const body = text.match(/\{[\s\S]*\}/)?.[0];
  if (!body) throw new Error("JSONの解析に失敗しました");
  try {
    return JSON.parse(body) as T;
  } catch {
    return JSON.parse(repairJson(body)) as T;
  }
}

/** AIにJSONを作らせる。読めない・途中で切れたときは、出力の上限を2倍にして、1回だけ作り直す */
export async function completeJson<T = unknown>(opts: Parameters<typeof completeText>[0]): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await completeText({ ...opts, maxTokens: opts.maxTokens * (attempt + 1), json: true });
      return parseJsonLoose<T>(text);
    } catch (e) {
      const retryable = e instanceof LlmTruncatedError || (e instanceof SyntaxError) || (e instanceof Error && e.message.startsWith("JSONの解析"));
      if (!retryable) throw e;
      console.error(`[completeJson] attempt ${attempt + 1} failed:`, e instanceof Error ? e.message : e);
      lastError = e;
    }
  }
  throw new Error(
    lastError instanceof LlmTruncatedError
      ? "AIの返答が長すぎて、評価を作りきれませんでした。会話を少し短くして、もう一度お試しください。"
      : "AIの返答を読み取れませんでした。もう一度お試しください。"
  );
}
