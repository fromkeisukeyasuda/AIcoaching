"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EvaluationResult, SessionData, SessionRecord } from "@/types";
import { MIN_EVAL_USER_MESSAGES } from "@/lib/scenarios";
import { track } from "@/lib/track";
import { clearEvalCaches, fetchEvaluation, readCachedEvaluation, readCachedOral } from "@/lib/evalClient";

/* 面談の終了後に、AIが評価と振り返りシートを作る待ち画面。
   できあがったら、記録（振り返り）の画面を開く。評価の結果の表示は、記録の画面だけで行う */
export default function EvaluationPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return; // 開発モードの二重実行で、評価を2回呼ばない
    started.current = true;

    const stored = localStorage.getItem("coachingSession");
    if (!stored) { router.replace("/session"); return; }

    let session: SessionData;
    let history: SessionRecord[];
    try {
      session = JSON.parse(stored);
      history = JSON.parse(localStorage.getItem("sessionHistory") ?? "[]");
    } catch {
      router.replace("/session");
      return;
    }

    // すでに記録済みなら、そのまま記録の画面へ
    if (history.some((r) => r.id === session.startedAt)) {
      router.replace(`/history?open=${encodeURIComponent(session.startedAt)}`);
      return;
    }

    const userMsgs = session.messages.filter((m) => m.role === "user");
    if (userMsgs.length < MIN_EVAL_USER_MESSAGES) {
      setError("会話が少なすぎるため、評価できません。もう少し会話してから、終了してください。");
      return;
    }

    const save = (evaluation: EvaluationResult) => {
      const oral = readCachedOral(session.startedAt) ?? undefined;
      const record: SessionRecord = { id: session.startedAt, session, evaluation, savedAt: new Date().toISOString(), ...(oral ? { oral } : {}) };
      try {
        localStorage.setItem("sessionHistory", JSON.stringify([record, ...history].slice(0, 50)));
      } catch { /* 容量超過などは無視。記録の画面には、保存できた分だけ出る */ }
      clearEvalCaches();
      track("eval", "practice");
      router.replace(`/history?open=${encodeURIComponent(record.id)}`);
    };

    // 口頭試問の間に作っておいた評価があれば、それを使う
    const cached = readCachedEvaluation(session.startedAt);
    if (cached) { save(cached); return; }

    fetchEvaluation(session, history).then(save).catch((e: Error) => setError(e.message));
  }, [router]);

  if (error) {
    return (
      <div className="screen-minh flex items-center justify-center px-6 text-center">
        <div className="max-w-[420px]">
          <h2 className="mb-2.5 text-[19px] font-bold text-white">評価の取得に失敗しました</h2>
          <p className="mb-6 text-[13px] leading-[1.8] text-white/70">{error}</p>
          <div className="flex flex-col items-center gap-2.5">
            <button onClick={() => window.location.reload()} className="btn-primary rounded-full px-7 py-3 text-sm font-bold text-white">
              もう一度評価する
            </button>
            <Link href="/session" className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-white/70" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}>
              練習に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-minh flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 h-[52px] w-[52px] animate-spin rounded-full border-[3px] border-white/10 border-t-pink-300" />
        <p className="text-[15px] font-bold text-white">振り返りを作成中…</p>
        <p className="mt-1.5 text-xs text-white/50">AIが評価をまとめています（1分ほどかかります）</p>
      </div>
    </div>
  );
}
