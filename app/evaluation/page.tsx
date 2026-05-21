"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionData, SessionRecord, EvaluationResult } from "@/types";

function ScoreBar({ score, maxScore, animate }: { score: number; maxScore: number; animate: boolean }) {
  const percentage = (score / maxScore) * 100;
  const color =
    percentage >= 80 ? "bg-emerald-500"
    : percentage >= 60 ? "bg-indigo-500"
    : percentage >= 40 ? "bg-amber-500"
    : "bg-red-400";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: animate ? `${percentage}%` : "0%" }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-10 text-right">
        {score}/{maxScore}
      </span>
    </div>
  );
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-600" : score >= 60 ? "text-indigo-600" : "text-amber-600";
  const bgColor = score >= 80 ? "bg-emerald-50" : score >= 60 ? "bg-indigo-50" : "bg-amber-50";
  const label = score >= 80 ? "優秀" : score >= 70 ? "良好" : score >= 60 ? "標準" : "要練習";

  return (
    <div className={`w-28 h-28 rounded-full ${bgColor} flex flex-col items-center justify-center`}>
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
    if (!stored) {
      router.push("/session");
      return;
    }

    const sessionData: SessionData = JSON.parse(stored);
    setSession(sessionData);

    // 履歴から前回セッションの改善点を取得（重複保存を避けるため現セッションは除外）
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
      body: JSON.stringify({
        messages: sessionData.messages,
        scenario: sessionData.scenario,
        previousImprovements: prevImprovements,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "評価の取得に失敗しました");
        }
        return res.json() as Promise<EvaluationResult>;
      })
      .then((data) => {
        setResult(data);

        // 履歴に保存（同一セッションの重複保存を防ぐ）
        try {
          const recordId = sessionData.startedAt;
          const alreadySaved = history.some((r) => r.id === recordId);
          if (!alreadySaved) {
            const newRecord: SessionRecord = {
              id: recordId,
              session: sessionData,
              evaluation: data,
              savedAt: new Date().toISOString(),
            };
            const updatedHistory = [newRecord, ...history].slice(0, 50);
            localStorage.setItem("sessionHistory", JSON.stringify(updatedHistory));
          }
        } catch {
          // localStorage 書き込み失敗は無視
        }

        setIsLoading(false);
        setTimeout(() => setAnimateScores(true), 100);
      })
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [router]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-1">セッションを分析中...</p>
          <p className="text-sm text-slate-400">AIがあなたのコーチングを評価しています</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">エラーが発生しました</h2>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <Link href="/session" className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors">
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ホームに戻る
            </Link>
            <Link href="/history" className="inline-flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              練習履歴を見る
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">セッション評価</h1>
          <p className="text-slate-400 text-sm">
            {session.scenario.title}・{session.scenario.clientName}さん・{messageCount}回の発言
          </p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-6">
            <ScoreCircle score={result.overallScore} />
            <div className="flex-1">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">総合評価</h2>
              <p className="text-slate-700 leading-relaxed text-sm">{result.summary}</p>
            </div>
          </div>
        </div>

        {/* Category Scores */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-5">評価カテゴリ</h2>
          <div className="space-y-5">
            {result.scores.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">{item.category}</span>
                </div>
                <ScoreBar score={item.score} maxScore={item.maxScore} animate={animateScores} />
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Improvements */}
        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">強み</h2>
            </div>
            <ul className="space-y-2">
              {result.strengths.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-sm font-semibold text-slate-800">改善点</h2>
            </div>
            <ul className="space-y-2">
              {result.improvements.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 前回の改善点チェック（前回セッションがある場合のみ表示） */}
        {hasPrevReview && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-sm font-semibold text-slate-800">前回の改善点チェック</h2>
              </div>
              <div className="flex items-center gap-2">
                {previousRecord && (
                  <span className="text-xs text-slate-400">
                    前回：{previousRecord.session.scenario.title}
                  </span>
                )}
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  addressedCount === totalPrev
                    ? "bg-emerald-100 text-emerald-700"
                    : addressedCount > 0
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-slate-100 text-slate-600"
                }`}>
                  {addressedCount}/{totalPrev} 対応済み
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {result.previousImprovementsReview!.map((review, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3.5 rounded-xl ${
                    review.addressed ? "bg-emerald-50 border border-emerald-100" : "bg-slate-50 border border-slate-100"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    review.addressed ? "bg-emerald-500" : "bg-slate-300"
                  }`}>
                    {review.addressed ? (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{review.item}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{review.comment}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    review.addressed
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-slate-500 bg-slate-200"
                  }`}>
                    {review.addressed ? "対応済み" : "要改善"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-indigo-800">次のステップ</h2>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed">{result.nextSteps}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Link
            href="/session"
            className="flex-1 text-center px-5 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            もう一度練習する
          </Link>
          <Link
            href="/history"
            className="px-5 py-3 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            履歴を見る
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem("coachingSession");
              router.push("/");
            }}
            className="px-5 py-3 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            ホームへ
          </button>
        </div>
      </div>
    </main>
  );
}
