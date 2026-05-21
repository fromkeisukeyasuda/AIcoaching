"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 80
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
    : score >= 60
      ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/20"
      : "bg-amber-500/15 text-amber-400 border-amber-500/20";
  return (
    <span className={`text-sm font-bold px-2.5 py-1 rounded-lg border ${cls}`}>
      {score}点
    </span>
  );
}

function MiniBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-indigo-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/30 w-7 text-right">{score}/{maxScore}</span>
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("sessionHistory");
    if (raw) setRecords(JSON.parse(raw));
    setLoaded(true);
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter((r) => r.id !== id);
    setRecords(updated);
    localStorage.setItem("sessionHistory", JSON.stringify(updated));
  };

  const clearAll = () => {
    if (!confirm("全ての練習記録を削除しますか？")) return;
    setRecords([]);
    localStorage.removeItem("sessionHistory");
  };

  const avgScore = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.evaluation.overallScore, 0) / records.length) : 0;

  if (!loaded) return null;

  return (
    <main className="min-h-screen bg-[#080810]">
      {/* 背景グロー */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[300px] bg-violet-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">

        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-white/35 hover:text-white/70 transition-colors mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            ホームに戻る
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">練習履歴</h1>
              <p className="text-white/30 text-sm">
                {records.length > 0 ? `${records.length}件のセッション記録` : "まだ記録がありません"}
              </p>
            </div>
            {records.length > 0 && (
              <button onClick={clearAll} className="text-sm text-white/25 hover:text-red-400 transition-colors">
                全て削除
              </button>
            )}
          </div>
        </div>

        {/* 統計カード */}
        {records.length > 0 && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
              <div className="text-center px-4">
                <p className="text-2xl font-bold text-white">{records.length}</p>
                <p className="text-xs text-white/30 mt-0.5">セッション数</p>
              </div>
              <div className="text-center px-4">
                <p className={`text-2xl font-bold ${avgScore >= 80 ? "text-emerald-400" : avgScore >= 60 ? "text-indigo-400" : "text-amber-400"}`}>
                  {avgScore}
                </p>
                <p className="text-xs text-white/30 mt-0.5">平均スコア</p>
              </div>
              <div className="text-center px-4">
                <p className={`text-2xl font-bold ${records[0].evaluation.overallScore >= 80 ? "text-emerald-400" : records[0].evaluation.overallScore >= 60 ? "text-indigo-400" : "text-amber-400"}`}>
                  {records[0].evaluation.overallScore}
                </p>
                <p className="text-xs text-white/30 mt-0.5">最新スコア</p>
              </div>
            </div>

            {/* スコア推移 */}
            {records.length >= 2 && (
              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <p className="text-xs text-white/20 mb-3">スコア推移（新しい順 →）</p>
                <div className="flex items-end gap-1 h-10">
                  {[...records].slice(0, 12).reverse().map((r, i, arr) => {
                    const pct = r.evaluation.overallScore / 100;
                    const isLatest = i === arr.length - 1;
                    return (
                      <div key={r.id} className="flex-1 flex flex-col items-center" title={`${r.evaluation.overallScore}点`}>
                        <div
                          className={`w-full rounded-t transition-all ${isLatest ? "bg-indigo-500" : "bg-white/15"}`}
                          style={{ height: `${Math.max(pct * 100, 8)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 空の状態 */}
        {records.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              📋
            </div>
            <h2 className="text-lg font-semibold text-white/60 mb-2">まだ練習記録がありません</h2>
            <p className="text-sm text-white/25 mb-6 leading-relaxed">
              セッションを終了して評価を受けると<br />自動的にここに記録されます
            </p>
            <Link href="/session" className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors">
              セッションを開始する
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record, index) => {
              const isExpanded = expanded.has(record.id);
              const msgCount = record.session.messages.filter((m) => m.role === "user").length;
              const prevScore = records[index + 1]?.evaluation.overallScore;
              const scoreDiff = prevScore !== undefined ? record.evaluation.overallScore - prevScore : null;
              const hasPrevReview = record.evaluation.previousImprovementsReview?.length ?? 0 > 0;
              const addressedCount = record.evaluation.previousImprovementsReview?.filter((r) => r.addressed).length ?? 0;
              const totalPrev = record.evaluation.previousImprovementsReview?.length ?? 0;

              return (
                <div key={record.id} className="bg-white/[0.04] border border-white/[0.08] rounded-2xl overflow-hidden">

                  {/* カードヘッダー */}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-xl flex-shrink-0">
                      {record.session.scenario.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-white/80 text-sm truncate">{record.session.scenario.title}</p>
                        {index === 0 && (
                          <span className="text-xs font-medium text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full flex-shrink-0">最新</span>
                        )}
                      </div>
                      <p className="text-xs text-white/30">{formatDate(record.savedAt)}・{msgCount}往復</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ScoreBadge score={record.evaluation.overallScore} />
                      {scoreDiff !== null && (
                        <span className={`text-xs font-semibold ${scoreDiff > 0 ? "text-emerald-400" : scoreDiff < 0 ? "text-red-400" : "text-white/25"}`}>
                          {scoreDiff > 0 ? `▲${scoreDiff}` : scoreDiff < 0 ? `▼${Math.abs(scoreDiff)}` : "±0"}
                        </span>
                      )}
                      <svg className={`w-4 h-4 text-white/25 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* 展開コンテンツ */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.06] px-5 py-5 space-y-5">
                      <p className="text-sm text-white/50 leading-relaxed">{record.evaluation.summary}</p>

                      {/* スコア詳細 */}
                      <div>
                        <h3 className="text-xs font-semibold text-white/25 uppercase tracking-wider mb-3">評価スコア</h3>
                        <div className="space-y-2.5">
                          {record.evaluation.scores.map((s) => (
                            <div key={s.category}>
                              <div className="flex justify-between mb-1">
                                <span className="text-xs font-medium text-white/45">{s.category}</span>
                              </div>
                              <MiniBar score={s.score} maxScore={s.maxScore} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 強み・改善点 */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-emerald-500/[0.06] border border-emerald-500/10 rounded-xl p-3.5">
                          <h3 className="text-xs font-semibold text-emerald-400/70 mb-2">強み</h3>
                          <ul className="space-y-1">
                            {record.evaluation.strengths.map((item, i) => (
                              <li key={i} className="text-xs text-white/45 leading-relaxed">・{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-amber-500/[0.06] border border-amber-500/10 rounded-xl p-3.5">
                          <h3 className="text-xs font-semibold text-amber-400/70 mb-2">改善点</h3>
                          <ul className="space-y-1">
                            {record.evaluation.improvements.map((item, i) => (
                              <li key={i} className="text-xs text-white/45 leading-relaxed">・{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 前回の改善点チェック */}
                      {hasPrevReview && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-white/25 uppercase tracking-wider">前回の改善点チェック</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              addressedCount === totalPrev
                                ? "bg-emerald-500/15 text-emerald-400"
                                : addressedCount > 0
                                  ? "bg-indigo-500/15 text-indigo-400"
                                  : "bg-white/[0.06] text-white/30"
                            }`}>
                              {addressedCount}/{totalPrev} 対応済み
                            </span>
                          </div>
                          <div className="space-y-2">
                            {record.evaluation.previousImprovementsReview!.map((rev, i) => (
                              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                                rev.addressed
                                  ? "bg-emerald-500/[0.07] border-emerald-500/15"
                                  : "bg-white/[0.03] border-white/[0.06]"
                              }`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${rev.addressed ? "bg-emerald-500" : "bg-white/15"}`}>
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {rev.addressed
                                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    }
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white/55">{rev.item}</p>
                                  <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{rev.comment}</p>
                                </div>
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${rev.addressed ? "text-emerald-400 bg-emerald-500/15" : "text-white/30 bg-white/[0.06]"}`}>
                                  {rev.addressed ? "✓" : "未"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 次のステップ */}
                      <div className="bg-indigo-500/[0.07] border border-indigo-500/10 rounded-xl p-3.5">
                        <h3 className="text-xs font-semibold text-indigo-400/70 mb-1.5">次のステップ</h3>
                        <p className="text-xs text-white/40 leading-relaxed">{record.evaluation.nextSteps}</p>
                      </div>

                      {/* 削除 */}
                      <div className="pt-1 border-t border-white/[0.06] flex justify-end">
                        <button
                          onClick={() => { if (confirm("この記録を削除しますか？")) deleteRecord(record.id); }}
                          className="text-xs text-white/20 hover:text-red-400 transition-colors"
                        >
                          この記録を削除
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
