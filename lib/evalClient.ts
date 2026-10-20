import { EvaluationResult, OralResult, SessionData, SessionRecord } from "@/types";

/* 面談の終了後の評価づくり（ブラウザ側）。
   口頭試問を受けるときは、試問の間に、評価を先に作っておく。できた結果は、いったん localStorage に置き、
   評価の待ち画面（/evaluation）が、それを使って、記録を保存する。 */
const EVAL_KEY = "coachingEval";
const ORAL_KEY = "coachingOral";

export function readHistory(): SessionRecord[] {
  try {
    return JSON.parse(localStorage.getItem("sessionHistory") ?? "[]");
  } catch {
    return [];
  }
}

/** 面談の評価（点数・振り返りシートなど）を、AIに作らせる */
export async function fetchEvaluation(session: SessionData, history: SessionRecord[]): Promise<EvaluationResult> {
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: session.messages,
      scenario: session.scenario,
      previousImprovements: history[0]?.evaluation.improvements ?? [],
    }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "評価の取得に失敗しました");
  }
  return res.json();
}

const write = (key: string, id: string, value: unknown) => {
  try { localStorage.setItem(key, JSON.stringify({ id, value })); } catch { /* 容量超過などは無視 */ }
};
const read = <T,>(key: string, id: string): T | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "null");
    return raw && raw.id === id ? (raw.value as T) : null;
  } catch {
    return null;
  }
};

export const cacheEvaluation = (id: string, v: EvaluationResult) => write(EVAL_KEY, id, v);
export const readCachedEvaluation = (id: string) => read<EvaluationResult>(EVAL_KEY, id);
export const cacheOral = (id: string, v: OralResult) => write(ORAL_KEY, id, v);
export const readCachedOral = (id: string) => read<OralResult>(ORAL_KEY, id);
export function clearEvalCaches() {
  try {
    localStorage.removeItem(EVAL_KEY);
    localStorage.removeItem(ORAL_KEY);
  } catch { /* noop */ }
}
