"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionData, SessionRecord, EvaluationResult } from "@/types";

function ScoreBar({ score, maxScore, animate }: { score: number; maxScore: number; animate: boolean }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-indigo-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: animate ? `${pct}%` : "0%" }}
        />
      </div>
      <span className="text-sm font-semibold text-white/70 w-10 text-right">{score}/{maxScore}</span>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400" : score >= 60 ? "text-indigo-400" : "text-amber-400";
  const bg = score >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : score >= 60 ? "bg-indigo-500/10 border-indigo-500/20" : "bg-amber-500/10 border-amber-500/20";
  const label = score >= 80 ? "優秀" : score >= 70 ? "良好" : score >= 60 ? "標準" : "要練習";
  return (
    <div className={`w-28 h-28 rounded-full border-2 ${bg} flex flex-col items-center justify-center flex-shrink-0`}>
      <span className={`text-3xl font-bold ${color}`}>{score}</span>
      <span className={`text-xs font-medium ${color} mt-0.5`}>{label}</span>
    </div>
  );
}

export default function EvaluationPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animateScores, setAnimateScores] = useState(false);
  const [previousRecord, setPreviousRecord] = useState<SessionRecord | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("coachingSession");
    if (!stored) { router.push("/session"); return; }

    const sessionData: SessionData = JSON.parse(stored);
    setSession(sessionData);

    const historyRaw = localStorage.getItem("sessionHistory");
    const history: SessionRecord[] = historyRaw ? JSON.parse(historyRaw) : [];
    const prevRecord = history.find((r) => r.id !== sessionData.startedAt) ?? null;
    setPreviousRecord(prevRecord);
    const prevImprovements = prevRecord?.evaluation.improvements ?? [];

    const userMessages = sessionData.messages.filter((m) => m.role === "user");
    if (userMessages.length < 2) {
      setError("セッションのメッセージが少なすぎます。もう少し会話してから評価してください。");
      setIsLoading(false);
      return;
    }

    fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: sessionData.messages, scenario: sessionData.scenario, previousImprovements: prevImprovements }),
    })
      .then(async (res) => {
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "評価の取得に失敗しました"); }
        return res.json() as Promise<EvaluationResult>;
      })
      .then((data) => {
        setResult(data);
        try {
          const recordId = sessionData.startedAt;
          const alreadySaved = history.some((r) => r.id === recordId);
          if (!alreadySaved) {
            const newRecord: SessionRecord = { id: recordId, session: sessionData, evaluation: data, savedAt: new Date().toISOString() };
            const updated = [newRecord, ...history].slice(0, 50);
            localStorage.setItem("sessionHistory", JSON.stringify(updated));
          }
        } catch { /* ignore */ }
        setIsLoading(false);
        setTimeout(() => setAnimateScores(true), 100);
      })
      .catch((err: Error) => { setError(err.message); setIsLoading(false); });
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border border-t-indigo-400 border-white/10 rounded-full animate-spin mx-auto mb-5" />
          <p className="text-white/60 font-medium mb-1">セッションを分析中...</p>
          <p className="text-sm text-white/25">AIがコーチングを評価しています</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#080810] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">エラーが発生しました</h2>
          <p className="text-white/40 text-sm mb-6">{error}</p>
          <Link href="/session" className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
            セッションに戻る
          </Link>
        </div>
      </main>
    );
  }

  if (!result || !session) return null;

  const messageCount = session.messages.filter((m) => m.role === "user").length;
  const hasPrevReview = result.previousImprovementsReview && result.previousImprovementsReview.length > 0;
  const addressedCount = result.previousImprovementsReview?.filter((r) => r.addressed).length ?? 0;
  const totalPrev = result.previousImprovementsReview?.length ?? 0;

  return (
    <main className="min-h-screen bg-[#080810]">
      {/* 背景グロー */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-1.5 text-sm text-white/35 hover:text-white/70 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ホームに戻る
            </Link>
            <Link href="/history" className="flex items-center gap-1.5 text-sm text-indigo-400/70 hover:text-indigo-400 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              練習履歴
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">セッション評価</h1>
          <p className="text-white/30 text-sm">
            {session.scenario.title}・{session.scenario.clientName}さん・{messageCount}回の発言
          </p>
        </div>

        {/* 総合スコア */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-6">
            <ScoreCircle score={result.overallScore} />
            <div className="flex-1">
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">総合評価</h2>
              <p className="text-white/70 leading-relaxed text-sm">{result.summary}</p>
            </div>
          </div>
        </div>

        {/* 評価カテゴリ */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-5">
          <h2 className="text-sm font-semibold text-white/70 mb-5">評価カテゴリ</h2>
          <div className="space-y-5">
            {result.scores.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white/60">{item.category}</span>
                </div>
                <ScoreBar score={item.score} maxScore={item.maxScore} animate={animateScores} />
                <p className="text-xs text-white/30 mt-1.5 leading-relaxed">{item.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 強み・改善点 */}
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-emerald-400">強み</h2>
            </div>
            <ul className="space-y-2">
              {result.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60 leading-relaxed">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-amber-500/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-amber-400">改善点</h2>
            </div>
            <ul className="space-y-2">
              {result.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/60 leading-relaxed">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 前回の改善点チェック */}
        {hasPrevReview && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-white/70">前回の改善点チェック</h2>
                {previousRecord && (
                  <span className="text-xs text-white/25">前回：{previousRecord.session.scenario.title}</span>
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                addressedCount === totalPrev
                  ? "bg-emerald-500/15 text-emerald-400"
                  : addressedCount > 0
                    ? "bg-indigo-500/15 text-indigo-400"
                    : "bg-white/[0.06] text-white/40"
              }`}>
                {addressedCount}/{totalPrev} 対応済み
              </span>
            </div>
            <div className="space-y-3">
              {result.previousImprovementsReview!.map((review, i) => (
                <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                  review.addressed
                    ? "bg-emerald-500/[0.07] border-emerald-500/15"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    review.addressed ? "bg-emerald-500" : "bg-white/15"
                  }`}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {review.addressed
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      }
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/70">{review.item}</p>
                    <p className="text-xs text-white/35 mt-1 leading-relaxed">{review.comment}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    review.addressed
                      ? "text-emerald-400 bg-emerald-500/15"
                      : "text-white/35 bg-white/[0.06]"
                  }`}>
                    {review.addressed ? "対応済み" : "要改善"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 次のステップ */}
        <div className="bg-indigo-500/[0.08] border border-indigo-500/15 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-indigo-500/20 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-indigo-400">次のステップ</h2>
          </div>
          <p className="text-sm text-white/50 leading-relaxed">{result.nextSteps}</p>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          <Link
            href="/session"
            className="flex-1 text-center px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            もう一度練習する
          </Link>
          <Link
            href="/history"
            className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-sm font-medium rounded-xl border border-white/[0.08] transition-colors"
          >
            履歴を見る
          </Link>
          <Link
            href="/"
            className="px-5 py-3 bg-white/[0.05] hover:bg-white/[0.08] text-white/60 text-sm font-medium rounded-xl border border-white/[0.08] transition-colors"
          >
            ホームへ
          </Link>
        </div>
      </div>
    </main>
  );
}
