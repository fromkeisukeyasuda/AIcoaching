"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionData, SessionRecord, EvaluationResult } from "@/types";

function ScoreBar({ score, maxScore, animate }: { score: number; maxScore: number; animate: boolean }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: animate ? `${pct}%` : "0%" }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-500 w-10 text-right">{score}/{maxScore}</span>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-blue-600" : "text-amber-600";
  const bg = score >= 80 ? "bg-emerald-50 border-emerald-200" : score >= 60 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200";
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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-2 border-t-blue-500 border-slate-200 rounded-full animate-spin mx-auto mb-5" />
          <p className="text-slate-700 font-medium mb-1">セッションを分析中...</p>
          <p className="text-sm text-slate-400">AIがコーチングを評価しています</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">エラーが発生しました</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link href="/session" className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
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
    <main className="min-h-screen bg-slate-50">

      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          <Link href="/history" className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 transition-colors font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            練習履歴
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* タイトル */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">セッション評価</h1>
          <p className="text-slate-400 text-sm">
            {session.scenario.title}・{session.scenario.clientName}さん・{messageCount}回の発言
          </p>
        </div>

        {/* 総合スコア */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
          <div className="flex items-center gap-6">
            <ScoreCircle score={result.overallScore} />
            <div className="flex-1">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">総合評価</h2>
              <p className="text-slate-600 leading-relaxed text-sm">{result.summary}</p>
            </div>
          </div>
        </div>

        {/* 評価カテゴリ */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-5">評価カテゴリ</h2>
          <div className="space-y-5">
            {result.scores.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">{item.category}</span>
                </div>
                <ScoreBar score={item.score} maxScore={item.maxScore} animate={animateScores} />
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 強み・改善点 */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-emerald-700">強み</h2>
            </div>
            <ul className="space-y-2">
              {result.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-emerald-800 leading-relaxed">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-amber-700">改善点</h2>
            </div>
            <ul className="space-y-2">
              {result.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-800 leading-relaxed">
                  <span className="w-1 h-1 bg-amber-500 rounded-full mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 前回の改善点チェック */}
        {hasPrevReview && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-violet-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-700">前回の改善点チェック</h2>
                {previousRecord && (
                  <span className="text-xs text-slate-400">前回：{previousRecord.session.scenario.title}</span>
                )}
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                addressedCount === totalPrev
                  ? "bg-emerald-100 text-emerald-700"
                  : addressedCount > 0
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-500"
              }`}>
                {addressedCount}/{totalPrev} 対応済み
              </span>
            </div>
            <div className="space-y-3">
              {result.previousImprovementsReview!.map((review, i) => (
                <div key={i} className={`flex items-start gap-3 p-3.5 rounded-xl border ${
                  review.addressed
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-200"
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    review.addressed ? "bg-emerald-500" : "bg-slate-300"
                  }`}>
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {review.addressed
                        ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      }
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{review.item}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{review.comment}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    review.addressed
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-slate-500 bg-slate-100"
                  }`}>
                    {review.addressed ? "対応済み" : "要改善"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 次のステップ */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-blue-700">次のステップ</h2>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">{result.nextSteps}</p>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          <Link
            href="/session"
            className="flex-1 text-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            もう一度練習する
          </Link>
          <Link
            href="/history"
            className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl border border-slate-200 transition-colors"
          >
            履歴を見る
          </Link>
          <Link
            href="/"
            className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl border border-slate-200 transition-colors"
          >
            ホームへ
          </Link>
        </div>
      </div>
    </main>
  );
}
