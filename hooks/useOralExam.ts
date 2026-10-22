"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Message, OralItem, OralResult, Scenario, SessionData } from "@/types";
import { INTERVIEWER_VOICE_PREFS, oralIntro, ORAL_OUTRO, ORAL_QUESTIONS, spokenQuestion } from "@/lib/oral";
import { cacheEvaluation, cacheOral, fetchEvaluation, readHistory } from "@/lib/evalClient";

export type OralPhase = "idle" | "confirm" | "oral" | "finishing" | "result";

interface TtsLike {
  stop(): void;
  unlock(): void;
  setVoicePrefs(prefs: string[]): void;
  pushChunk(text: string): void;
}

type Feedback = Pick<OralItem, "score" | "headline" | "good" | "improve">;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "失敗しました");
  return data as T;
}

/** 1回だけ、やり直す */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return fn();
  }
}

/** 面談の終了後の、口頭試問と面接官評価。
   面接官が、5つの質問を順にする → 答えるたびに、裏で採点 → 最後に総評 → 評価の待ち画面へ。
   口頭試問をしている間に、面談そのものの評価（振り返りシートなど）も、先に作っておく */
export function useOralExam(opts: {
  tts: TtsLike;
  scenario: Scenario | null;
  messages: Message[];
  startedAt: string | null;
  /** 口頭試問を受けないとき（「いいえ」・やめる）の、いつもの終了処理 */
  onSkip: () => void;
  /** 質問の数（チュートリアルは、短く2問。指定がなければ、5問） */
  questionCount?: number;
}) {
  const { tts, scenario, messages, startedAt, onSkip } = opts;
  const QUESTIONS = ORAL_QUESTIONS.slice(0, opts.questionCount ?? ORAL_QUESTIONS.length);
  const router = useRouter();

  const [phase, setPhase] = useState<OralPhase>("idle");
  const [dialog, setDialog] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<OralResult | null>(null);
  const [ready, setReady] = useState(false); // 面談の評価（振り返りシート）の用意ができたか

  const answersRef = useRef<string[]>([]);
  const feedbackRef = useRef<Promise<Feedback>[]>([]);
  const evalRef = useRef<Promise<unknown> | null>(null);
  const sessionRef = useRef<SessionData | null>(null);
  const finishingRef = useRef(false);

  const speak = useCallback((text: string) => {
    text.split(/(?<=[。！？])/).map((s) => s.trim()).filter((s) => s.length >= 2).forEach((s) => tts.pushChunk(s));
  }, [tts]);

  const openConfirm = useCallback(() => setPhase("confirm"), []);

  const decline = useCallback(() => {
    setPhase("idle");
    onSkip();
  }, [onSkip]);

  const accept = useCallback(() => {
    if (!scenario || !startedAt) return;
    const session: SessionData = { scenario, messages, startedAt, endedAt: new Date().toISOString() };
    sessionRef.current = session;
    try { localStorage.setItem("coachingSession", JSON.stringify(session)); } catch { /* noop */ }

    // 口頭試問をしている間に、面談の評価を作っておく（失敗したら、評価の待ち画面が、作り直す）
    evalRef.current = fetchEvaluation(session, readHistory())
      .then((r) => { cacheEvaluation(startedAt, r); return r; })
      .catch(() => null);

    evalRef.current.then(() => setReady(true));

    tts.stop();
    tts.unlock();
    tts.setVoicePrefs(INTERVIEWER_VOICE_PREFS);
    answersRef.current = [];
    feedbackRef.current = [];
    finishingRef.current = false;
    setResult(null);
    setReady(false);

    const intro = oralIntro(QUESTIONS.length);
    const first = spokenQuestion(0, QUESTIONS.length);
    setDialog([
      { role: "assistant", content: intro },
      { role: "assistant", content: first },
    ]);
    setStep(0);
    setPhase("oral");
    speak(intro);
    speak(first);
  }, [scenario, startedAt, messages, tts, speak, QUESTIONS.length]);

  const finish = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;

    const feedback = await Promise.all(feedbackRef.current);
    const items: OralItem[] = QUESTIONS.map((q, i) => ({
      key: q.key,
      question: q.text,
      answer: answersRef.current[i] ?? "",
      ...feedback[i],
    }));

    let result: OralResult;
    try {
      const sum = await withRetry(() =>
        postJson<{ overall: number; summary: string; strengths: string[]; improvements: string[]; consistency: string }>(
          "/api/oral/summary",
          { scenario: session.scenario, items }
        )
      );
      result = { items, ...sum };
    } catch {
      const scored = items.filter((it) => typeof it.score === "number") as (OralItem & { score: number })[];
      result = {
        items,
        overall: scored.length ? Math.round(scored.reduce((a, it) => a + it.score, 0) / scored.length) : 0,
        summary: "総評を作れませんでした。各質問の講評を、ご覧ください。",
        strengths: [],
        improvements: [],
        consistency: "",
      };
    }
    cacheOral(session.startedAt, result);

    // 面接官が、総合の評価を、読み上げる。振り返りシートへは、ボタンで進む（読み上げを、途中で切らないため）
    const body = result.summary || "各質問の講評は、振り返りシートで、ご確認ください。";
    const message = `面接官評価をお伝えします。総合は、${result.overall}点です。${body}`;
    setResult(result);
    setDialog((d) => [...d, { role: "assistant", content: message }]);
    setPhase("result");
    speak(message);
  }, [speak, QUESTIONS]);

  /** 振り返りシートを見る（面談の評価が用意できてから） */
  const review = useCallback(() => {
    tts.stop();
    router.push("/evaluation");
  }, [tts, router]);

  const submitAnswer = useCallback((text: string) => {
    const answer = text.trim();
    if (phase !== "oral" || finishingRef.current || !answer) return;
    const session = sessionRef.current;
    if (!session) return;

    tts.stop();
    const idx = step;
    const q = QUESTIONS[idx];
    answersRef.current[idx] = answer;

    // 答えを、裏で採点しておく（試問が続く間に、終わる）
    feedbackRef.current[idx] = withRetry(() =>
      postJson<Feedback>("/api/oral", { scenario: session.scenario, messages: session.messages, key: q.key, question: q.text, answer })
    ).catch(() => ({ score: undefined, headline: undefined, good: undefined, improve: undefined }) as Feedback);

    if (idx < QUESTIONS.length - 1) {
      const reply = "ありがとうございます。" + spokenQuestion(idx + 1, QUESTIONS.length);
      setDialog((d) => [...d, { role: "user", content: answer }, { role: "assistant", content: reply }]);
      setStep(idx + 1);
      speak(reply);
    } else {
      finishingRef.current = true;
      setDialog((d) => [...d, { role: "user", content: answer }, { role: "assistant", content: ORAL_OUTRO }]);
      setPhase("finishing");
      speak(ORAL_OUTRO);
      void finish();
    }
  }, [phase, step, tts, speak, finish, QUESTIONS]);

  /** 途中でやめて、いつもの終了処理へ */
  const cancel = useCallback(() => {
    tts.stop();
    finishingRef.current = true;
    setPhase("idle");
    onSkip();
  }, [tts, onSkip]);

  return { phase, dialog, step, result, ready, total: QUESTIONS.length, openConfirm, decline, accept, submitAnswer, cancel, review };
}
