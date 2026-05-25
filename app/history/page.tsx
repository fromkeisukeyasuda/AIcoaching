"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";

/* ══════════════════════════════════════════════════════════════════════
   デザイントークン（v3）
══════════════════════════════════════════════════════════════════════ */
const V = {
  navy:    "#1C2B4A",
  navyLt:  "#EBF0FA",
  green:   "#4DB689",
  greenLt: "#EBF8F3",
  greenDk: "#2E8B63",
  coral:   "#F07268",
  coralLt: "#FEF3F2",
  amber:   "#F59E0B",
  amberLt: "#FFFBEB",
  bg:      "#F4F7FA",
  surface: "#FFFFFF",
  ink:     "#1A2332",
  ink2:    "#4A5568",
  ink3:    "#8A9BAB",
  border:  "#E8ECF0",
  borderSoft: "#F0F4F8",
  sans:  '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  round: '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif',
} as const;

/* ── ユーティリティ ── */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function scoreColor(s: number) {
  return s >= 80 ? V.green : s >= 60 ? V.navy : V.amber;
}

/* ── スパークライン ── */
function Sparkline({ scores }: { scores: number[] }) {
  const n = Math.min(scores.length, 10);
  const slice = scores.slice(-n);
  if (slice.length < 2) return (
    <svg viewBox="0 0 160 40" width="160" height="40" style={{ display: "block" }}>
      <path d="M0 30 L160 20" fill="none" stroke={V.green} strokeWidth="2" />
    </svg>
  );
  const pts = slice.map((v, i) => {
    const px = (i / (n - 1)) * 156 + 2;
    const py = 35 - (v / 100) * 28;
    return `${px} ${py}`;
  }).join(" L");
  const last = slice[slice.length - 1];
  const lx = 158, ly = 35 - (last / 100) * 28;
  return (
    <svg viewBox="0 0 160 40" width="160" height="40" style={{ display: "block" }}>
      <defs>
        <linearGradient id="hist-spark3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.navy} stopOpacity="0.2" />
          <stop offset="100%" stopColor={V.navy} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts} L${lx} 40 L2 40 Z`} fill="url(#hist-spark3)" />
      <path d={`M${pts}`} fill="none" stroke={V.navy} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={V.coral} stroke="white" strokeWidth="2" />
    </svg>
  );
}

/* ── スコアミニバー ── */
function MiniBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? V.green : pct >= 60 ? V.navy : V.amber;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: V.borderSoft, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: V.round, fontSize: 11, color: V.ink2, fontWeight: 600, width: 36, textAlign: "right" }}>
        {score.toFixed(0)}/{maxScore}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   メインページ
══════════════════════════════════════════════════════════════════════ */
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
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
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

  const scores = records.map(r => r.evaluation.overallScore).reverse();

  const streak = (() => {
    let s = 0;
    for (let i = 0; i < records.length - 1; i++) {
      if (records[i].evaluation.overallScore > records[i + 1].evaluation.overallScore) s++;
      else break;
    }
    return s;
  })();

  if (!loaded) return null;

  const card: React.CSSProperties = {
    background: V.surface,
    border: `1px solid ${V.border}`,
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(26,35,50,0.05)",
  };

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", background: V.bg, fontFamily: V.sans }}>

      {/* ─── ページヘッダー ─── */}
      <div style={{ background: V.surface, borderBottom: `1px solid ${V.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: V.navy, margin: 0, letterSpacing: "-0.02em" }}>
                ふりかえり
              </h1>
              <div style={{ fontSize: 13, color: V.ink3, marginTop: 4 }}>
                {records.length > 0
                  ? `${records.length} セッションの練習記録`
                  : "まだ記録がありません"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: V.amberLt, color: V.amber, padding: "7px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                  🔥 {streak} 回連続上昇中
                </div>
              )}
              {records.length > 0 && (
                <button
                  onClick={clearAll}
                  style={{ fontSize: 12, color: V.ink3, background: "transparent", border: `1px solid ${V.border}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontFamily: V.sans }}
                >
                  全て削除
                </button>
              )}
              <Link
                href="/session"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: V.navy, color: "white", borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: `0 6px 16px -6px ${V.navy}` }}
              >
                ▶ 練習を始める
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── コンテンツ ─── */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 32px 40px" }}>

        {/* 統計カード */}
        {records.length > 0 && (
          <div style={{ ...card, padding: "22px 28px", marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.6fr", gap: 0, alignItems: "center" }}>
              {/* セッション数 */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 36, fontWeight: 800, color: V.navy, lineHeight: 1 }}>{records.length}</div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6 }}>セッション数</div>
              </div>
              {/* 平均スコア */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 36, fontWeight: 800, color: scoreColor(avgScore), lineHeight: 1 }}>{avgScore}</div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6 }}>平均スコア</div>
              </div>
              {/* 最新スコア */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 36, fontWeight: 800, color: scoreColor(records[0].evaluation.overallScore), lineHeight: 1 }}>
                  {records[0].evaluation.overallScore}
                </div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6 }}>最新スコア</div>
              </div>
              {/* スパークライン */}
              <div style={{ padding: "0 20px 0 24px" }}>
                <div style={{ fontSize: 11, color: V.ink3, marginBottom: 6, fontWeight: 600 }}>スコア推移</div>
                <Sparkline scores={scores} />
              </div>
            </div>
          </div>
        )}

        {/* 練習記録リスト */}
        {records.length === 0 ? (
          <div style={{ ...card, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.navy, marginBottom: 8 }}>
              まだ練習記録がありません
            </div>
            <div style={{ fontSize: 13, color: V.ink3, marginBottom: 24, lineHeight: 1.7 }}>
              セッションを完了すると、ここに練習の記録が表示されます。
            </div>
            <Link
              href="/session"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", background: V.navy, color: "white", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
            >
              ▶ 最初のセッションを始める
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {records.map((record, idx) => {
              const isExpanded = expanded.has(record.id);
              const ev = record.evaluation;
              const prevScore = records[idx + 1]?.evaluation.overallScore ?? null;
              const diff = prevScore !== null ? ev.overallScore - prevScore : null;

              return (
                <div key={record.id} style={{ ...card, overflow: "hidden", transition: "box-shadow 0.15s" }}>
                  {/* ─ ヘッダー行 ─ */}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    style={{ width: "100%", border: "none", background: "transparent", padding: "18px 22px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 16 }}
                  >
                    {/* 順位 */}
                    <div style={{ fontFamily: V.round, fontSize: 12, fontWeight: 700, color: idx === 0 ? V.green : V.ink3, width: 28, textAlign: "center", flexShrink: 0 }}>
                      {idx === 0 ? "⭐" : `#${idx + 1}`}
                    </div>

                    {/* シナリオアイコン */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: V.bg, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {record.session.scenario.icon}
                    </div>

                    {/* タイトル + 日時 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 15, color: V.navy, lineHeight: 1.2, marginBottom: 4 }}>
                        {record.session.scenario.title}
                      </div>
                      <div style={{ fontSize: 12, color: V.ink3 }}>
                        {formatDate(record.savedAt)} ・ {record.session.scenario.clientName}さん
                      </div>
                    </div>

                    {/* スコア + 前回比 */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: V.round, fontSize: 26, fontWeight: 800, color: scoreColor(ev.overallScore), lineHeight: 1 }}>
                        {ev.overallScore}
                      </div>
                      {diff !== null && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: diff >= 0 ? V.green : V.coral, marginTop: 2 }}>
                          {diff >= 0 ? `+${diff}` : diff} 点
                        </div>
                      )}
                    </div>

                    {/* 展開アイコン */}
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: V.bg, display: "grid", placeItems: "center", fontSize: 14, color: V.ink3, flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      ⌄
                    </div>
                  </button>

                  {/* ─ 展開パネル ─ */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${V.borderSoft}`, padding: "18px 22px" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 18 }}>

                        {/* 各軸スコア */}
                        <div>
                          <div style={{ fontFamily: V.round, fontSize: 13, fontWeight: 700, color: V.navy, marginBottom: 12 }}>スキル評価</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {ev.scores.map(s => (
                              <div key={s.category}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                  <span style={{ fontSize: 12, color: V.ink2 }}>{s.category}</span>
                                </div>
                                <MiniBar score={s.score} maxScore={s.maxScore} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 強み / 改善点 */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                          {/* 強み */}
                          <div style={{ background: V.greenLt, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: V.greenDk, marginBottom: 8 }}>✅ 良かった点</div>
                            {ev.strengths.slice(0, 2).map((s, i) => (
                              <div key={i} style={{ fontSize: 12, color: V.ink2, lineHeight: 1.6, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${V.green}` }}>{s}</div>
                            ))}
                          </div>

                          {/* 改善点 */}
                          <div style={{ background: V.coralLt, borderRadius: 12, padding: "12px 14px" }}>
                            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: "#C0453A", marginBottom: 8 }}>📈 改善できる点</div>
                            {ev.improvements.slice(0, 2).map((s, i) => (
                              <div key={i} style={{ fontSize: 12, color: V.ink2, lineHeight: 1.6, marginBottom: 4, paddingLeft: 8, borderLeft: `2px solid ${V.coral}` }}>{s}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 次のステップ */}
                      {ev.nextSteps && (
                        <div style={{ background: V.navyLt, borderRadius: 12, padding: "12px 16px", marginBottom: 16 }}>
                          <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: V.navy, marginBottom: 6 }}>🎯 次の練習で意識すること</div>
                          <div style={{ fontSize: 12, color: V.ink2, lineHeight: 1.7 }}>{ev.nextSteps}</div>
                        </div>
                      )}

                      {/* アクション行 */}
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Link
                          href="/evaluation?demo=1"
                          style={{ fontSize: 12, color: V.navy, textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 14px", border: `1px solid ${V.border}`, borderRadius: 8 }}
                        >
                          📊 詳細レポート
                        </Link>
                        <div style={{ flex: 1 }} />
                        <button
                          onClick={() => deleteRecord(record.id)}
                          style={{ fontSize: 11, color: V.ink3, background: "transparent", border: `1px solid ${V.border}`, borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontFamily: V.sans }}
                        >
                          削除
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
    </div>
  );
}
