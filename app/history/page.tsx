"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";

/* ══════════════════════════════════════════════════════════════════════
   デザイントークン（v2 共通）
══════════════════════════════════════════════════════════════════════ */
const V = {
  blue:       "#4A90E2",
  blueDeep:   "#2D6CB8",
  blueLite:   "#E3F2FD",
  coral:      "#FF6B6B",
  coralLite:  "#FFE3E3",
  green:      "#6BCB77",
  greenLite:  "#E8F5E9",
  greenDark:  "#2D7A36",
  orange:     "#FFB347",
  bg:         "#F8F9FA",
  surface:    "#FFFFFF",
  ink:        "#2D3436",
  ink2:       "#5B6066",
  ink3:       "#9AA0A6",
  border:     "#E5E7EB",
  borderSoft: "#EEF1F4",
  round: '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif',
  sans:  '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
} as const;

/* ══════════════════════════════════════════════════════════════════════
   ユーティリティ
══════════════════════════════════════════════════════════════════════ */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function scoreColor(s: number) {
  return s >= 80 ? V.green : s >= 60 ? V.blue : V.orange;
}

/* ── サイドバースパークライン ── */
function SidebarSparkline({ scores }: { scores: number[] }) {
  const n = Math.min(scores.length, 8);
  const slice = scores.slice(-n);
  if (slice.length < 2) return (
    <svg viewBox="0 0 120 36" width="100%" height="36" style={{ display: "block" }}>
      <path d="M0 28 L120 18" fill="none" stroke={V.blue} strokeWidth="1.5" />
    </svg>
  );
  const pts = slice.map((v, i) => {
    const px = (i / (n - 1)) * 120;
    const py = 32 - (v / 100) * 28;
    return `${px} ${py}`;
  }).join(" L");
  const last = slice[slice.length - 1];
  const lx = 120, ly = 32 - (last / 100) * 28;
  return (
    <svg viewBox="0 0 120 36" width="100%" height="36" style={{ display: "block" }}>
      <defs>
        <linearGradient id="hist-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.blue} stopOpacity="0.25" />
          <stop offset="100%" stopColor={V.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts.replace(/ L/g, " L")} L${lx} 36 L0 36 Z`} fill="url(#hist-spark)" />
      <path d={`M${pts}`} fill="none" stroke={V.blue} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={V.coral} />
    </svg>
  );
}

/* ── スコアミニバー ── */
function MiniBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? V.green : pct >= 60 ? V.blue : pct >= 40 ? V.orange : V.coral;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: V.bg, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: V.round, fontSize: 11, color: V.ink2, fontWeight: 600, width: 36, textAlign: "right" }}>
        {score}/{maxScore}
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
    background: V.surface, border: `1px solid ${V.border}`,
    borderRadius: 16, boxShadow: "0 1px 2px rgba(45,52,54,0.04)",
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "240px 1fr",
      gridTemplateRows: "64px 1fr",
      gridTemplateAreas: '"sidebar header" "sidebar main"',
      height: "100vh",
      background: V.bg,
      fontFamily: V.sans,
    }}>

      {/* ── Sidebar ── */}
      <aside style={{ gridArea: "sidebar", background: V.surface, borderRight: `1px solid ${V.border}`, display: "flex", flexDirection: "column", padding: "20px 14px 18px", overflow: "hidden" }}>
        <div style={{ fontFamily: V.sans, fontSize: 10, fontWeight: 600, color: V.ink3, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px 10px" }}>MENU</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { id: "chat",    icon: "💬", label: "練習する",   sub: "AIと対話",                              href: "/session" },
            { id: "history", icon: "📜", label: "会話履歴",   sub: `${records.length} セッション`,          href: "/history" },
            { id: "report",  icon: "📊", label: "レポート",   sub: records.length > 0 ? `最新 ${records[0]?.evaluation.overallScore} 点` : "最新の評価", href: "/evaluation" },
            { id: "home",    icon: "🏠", label: "ホーム",     sub: "",                                      href: "/" },
          ].map(item => {
            const active = item.id === "history";
            return (
              <Link key={item.id} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, background: active ? V.blueLite : "transparent", borderRadius: 12, padding: "12px 12px", textDecoration: "none", position: "relative" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: active ? V.blue : V.bg, color: active ? "#fff" : V.ink2, display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 13.5, color: active ? V.blue : V.ink, lineHeight: 1.2 }}>{item.label}</div>
                  {item.sub && <div style={{ fontFamily: V.sans, fontSize: 10.5, color: V.ink3, marginTop: 2 }}>{item.sub}</div>}
                </div>
                {active && <span style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 3, background: V.blue, borderRadius: "0 3px 3px 0" }} />}
              </Link>
            );
          })}
        </nav>

        {/* 今週の成長 */}
        <div style={{ marginTop: 22, padding: 14, background: V.bg, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 12, color: V.ink }}>スコア推移</div>
            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 13, color: streak > 0 ? V.green : V.ink3 }}>
              {streak > 0 ? `↑${streak}回連続` : "記録中"}
            </div>
          </div>
          <SidebarSparkline scores={scores} />
        </div>

        <div style={{ flex: 1 }} />

        {/* CTA */}
        <Link href="/session" style={{ background: V.coral, color: "#fff", borderRadius: 14, padding: "14px 16px", fontFamily: V.round, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: `0 10px 22px -10px ${V.coral}` }}>
          <div>
            <div>新しい練習を始める</div>
            <div style={{ fontFamily: V.sans, fontSize: 10.5, fontWeight: 400, marginTop: 2, opacity: 0.92 }}>3 つのシナリオから</div>
          </div>
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "grid", placeItems: "center", fontSize: 14 }}>→</span>
        </Link>
      </aside>

      {/* ── Header ── */}
      <header style={{ gridArea: "header", height: 64, padding: "0 28px", background: V.surface, borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: V.blue, display: "grid", placeItems: "center", color: "#fff", fontFamily: V.round, fontWeight: 700, fontSize: 18, boxShadow: `0 6px 14px -6px ${V.blue}` }}>聴</div>
          <div>
            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 15, color: V.ink, lineHeight: 1 }}>AIコーチトレーナー</div>
            <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 3 }}>安心して、ことばを試せる場所。</div>
          </div>
          <div style={{ width: 1, height: 28, background: V.border, margin: "0 8px" }} />
          <div>
            <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 14, color: V.ink, lineHeight: 1 }}>会話履歴</div>
            <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 3 }}>
              {records.length > 0 ? `${records.length} セッションの記録` : "まだ記録がありません"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: V.coralLite, color: V.coral, padding: "6px 12px", borderRadius: 999, fontFamily: V.round, fontWeight: 600, fontSize: 12 }}>
              <span style={{ fontSize: 14 }}>♥</span>
              <span>連続 {streak} 日</span>
            </div>
          )}
          {records.length > 0 && (
            <button
              onClick={clearAll}
              style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, background: "transparent", border: `1px solid ${V.border}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}
            >
              全て削除
            </button>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ gridArea: "main", padding: "24px 32px 32px", overflow: "auto", minHeight: 0 }}>

        {/* 統計カード */}
        {records.length > 0 && (
          <div style={{ ...card, padding: "22px 28px", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 0, alignItems: "center" }}>
              {/* セッション数 */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 32, fontWeight: 700, color: V.ink }}>{records.length}</div>
                <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 4 }}>セッション数</div>
              </div>
              {/* 平均スコア */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 32, fontWeight: 700, color: scoreColor(avgScore) }}>{avgScore}</div>
                <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 4 }}>平均スコア</div>
              </div>
              {/* 最新スコア */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 32, fontWeight: 700, color: scoreColor(records[0].evaluation.overallScore) }}>
                  {records[0].evaluation.overallScore}
                </div>
                <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 4 }}>最新スコア</div>
              </div>
              {/* スパークライン */}
              {records.length >= 2 && (
                <div style={{ padding: "0 0 0 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3 }}>スコア推移</div>
                    {records.length >= 2 && (
                      <div style={{ fontFamily: V.round, fontSize: 11, fontWeight: 700, color: records[0].evaluation.overallScore >= records[1].evaluation.overallScore ? V.green : V.coral }}>
                        {records[0].evaluation.overallScore >= records[1].evaluation.overallScore ? "↑" : "↓"} 前回比 {Math.abs(records[0].evaluation.overallScore - records[1].evaluation.overallScore)}点
                      </div>
                    )}
                  </div>
                  {/* バーチャート（ピクセル高さ固定） */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 40 }}>
                    {[...records].slice(0, 12).reverse().map((r, i, arr) => {
                      const h = Math.max(Math.round((r.evaluation.overallScore / 100) * 40), 3);
                      const isLatest = i === arr.length - 1;
                      return (
                        <div
                          key={r.id}
                          title={`${r.evaluation.overallScore}点`}
                          style={{
                            flex: 1,
                            height: h,
                            borderRadius: "3px 3px 0 0",
                            background: isLatest ? V.blue : V.border,
                            transition: "height 0.3s ease",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 空の状態 */}
        {records.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <div style={{ width: 64, height: 64, background: V.surface, border: `1px solid ${V.border}`, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>📋</div>
            <h2 style={{ fontFamily: V.round, fontSize: 18, fontWeight: 700, color: V.ink, marginBottom: 8 }}>まだ練習記録がありません</h2>
            <p style={{ fontFamily: V.sans, fontSize: 13, color: V.ink3, marginBottom: 24, lineHeight: 1.8 }}>
              セッションを終了して評価を受けると<br />自動的にここに記録されます
            </p>
            <Link href="/session" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: V.blue, color: "#fff", borderRadius: 12, fontFamily: V.round, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: `0 8px 20px -8px ${V.blue}` }}>
              セッションを開始する →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {records.map((record, index) => {
              const isOpen = expanded.has(record.id);
              const msgCount = record.session.messages.filter(m => m.role === "user").length;
              const prevScore = records[index + 1]?.evaluation.overallScore;
              const scoreDiff = prevScore !== undefined ? record.evaluation.overallScore - prevScore : null;
              const hasPrevReview = (record.evaluation.previousImprovementsReview?.length ?? 0) > 0;
              const addressedCount = record.evaluation.previousImprovementsReview?.filter(r => r.addressed).length ?? 0;
              const totalPrev = record.evaluation.previousImprovementsReview?.length ?? 0;

              return (
                <div key={record.id} style={{ ...card, overflow: "hidden", border: `1px solid ${isOpen ? V.blue : V.border}`, transition: "border-color 0.15s" }}>

                  {/* ヘッダー行 */}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    aria-expanded={isOpen}
                    style={{ width: "100%", background: "transparent", border: "none", padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: V.blueLite, border: `1px solid ${V.blue}20`, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>
                      {record.session.scenario.icon || "💬"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                        <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 14, color: V.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {record.session.scenario.title}
                        </div>
                        {index === 0 && (
                          <span style={{ fontFamily: V.sans, fontSize: 10, fontWeight: 600, color: V.blue, background: V.blueLite, border: `1px solid ${V.blue}40`, padding: "1px 8px", borderRadius: 999, flexShrink: 0 }}>最新</span>
                        )}
                      </div>
                      <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3 }}>
                        {formatDate(record.savedAt)} ・ {msgCount} 往復
                        {record.session.scenario.clientName && ` ・ ${record.session.scenario.clientName}さん`}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      {/* スコアバッジ */}
                      <span style={{ fontFamily: V.round, fontWeight: 700, fontSize: 14, color: scoreColor(record.evaluation.overallScore), background: scoreColor(record.evaluation.overallScore) + "18", border: `1px solid ${scoreColor(record.evaluation.overallScore)}30`, padding: "4px 12px", borderRadius: 8 }}>
                        {record.evaluation.overallScore}点
                      </span>
                      {/* 前回比 */}
                      {scoreDiff !== null && (
                        <span style={{ fontFamily: V.round, fontSize: 12, fontWeight: 700, color: scoreDiff > 0 ? V.green : scoreDiff < 0 ? V.coral : V.ink3 }}>
                          {scoreDiff > 0 ? `▲${scoreDiff}` : scoreDiff < 0 ? `▼${Math.abs(scoreDiff)}` : "±0"}
                        </span>
                      )}
                      <span style={{ fontFamily: V.round, fontSize: 16, color: V.ink3, display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
                    </div>
                  </button>

                  {/* 展開コンテンツ */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${V.borderSoft}`, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>

                      {/* サマリー */}
                      <p style={{ fontFamily: V.sans, fontSize: 13, color: V.ink2, lineHeight: 1.8 }}>{record.evaluation.summary}</p>

                      {/* スコア詳細 */}
                      <div>
                        <div style={{ fontFamily: V.sans, fontSize: 10, fontWeight: 700, color: V.ink3, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 10 }}>評価スコア</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {record.evaluation.scores.map(s => (
                            <div key={s.category}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontFamily: V.round, fontSize: 12, fontWeight: 600, color: V.ink }}>{s.category}</span>
                              </div>
                              <MiniBar score={s.score} maxScore={s.maxScore} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 強み・改善点 */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: V.greenLite, border: `1px solid ${V.green}30`, borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 11, color: V.greenDark, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>✔ 強み</div>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            {record.evaluation.strengths.map((item, i) => (
                              <li key={i} style={{ fontFamily: V.sans, fontSize: 12, color: V.greenDark, lineHeight: 1.8 }}>・{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div style={{ background: "#FFF8F0", border: `1px solid ${V.orange}30`, borderRadius: 12, padding: "14px 16px" }}>
                          <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 11, color: "#B36A00", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>⚠ 改善点</div>
                          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            {record.evaluation.improvements.map((item, i) => (
                              <li key={i} style={{ fontFamily: V.sans, fontSize: 12, color: "#7A4500", lineHeight: 1.8 }}>・{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* 前回の改善点チェック */}
                      {hasPrevReview && (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                            <div style={{ fontFamily: V.sans, fontSize: 10, fontWeight: 700, color: V.ink3, letterSpacing: "0.16em", textTransform: "uppercase" }}>前回の改善点チェック</div>
                            <span style={{ fontFamily: V.round, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, background: addressedCount === totalPrev ? V.greenLite : V.blueLite, color: addressedCount === totalPrev ? V.greenDark : V.blue }}>
                              {addressedCount}/{totalPrev} 対応済み
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {record.evaluation.previousImprovementsReview!.map((rev, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, background: rev.addressed ? V.greenLite : V.bg, border: `1px solid ${rev.addressed ? V.green + "40" : V.border}` }}>
                                <div style={{ width: 18, height: 18, borderRadius: "50%", background: rev.addressed ? V.green : V.border, color: "#fff", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                                  {rev.addressed ? "✓" : "−"}
                                </div>
                                <div>
                                  <div style={{ fontFamily: V.round, fontSize: 12, fontWeight: 600, color: V.ink }}>{rev.item}</div>
                                  <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 2, lineHeight: 1.6 }}>{rev.comment}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 次のステップ */}
                      <div style={{ background: V.blueLite, border: `1px solid ${V.blue}30`, borderRadius: 12, padding: "14px 16px" }}>
                        <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 11, color: V.blueDeep, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>🎯 次のステップ</div>
                        <p style={{ fontFamily: V.sans, fontSize: 12, color: V.blueDeep, lineHeight: 1.8, margin: 0 }}>{record.evaluation.nextSteps}</p>
                      </div>

                      {/* アクション行 */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: `1px dashed ${V.borderSoft}` }}>
                        <button
                          onClick={() => { if (confirm("この記録を削除しますか？")) deleteRecord(record.id); }}
                          style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, background: "transparent", border: "none", cursor: "pointer", padding: "4px 0" }}
                        >
                          この記録を削除
                        </button>
                        <Link href="/evaluation?demo=1" style={{ fontFamily: V.round, fontSize: 12, fontWeight: 700, color: V.blue, background: V.blueLite, border: `1px solid ${V.blue}30`, borderRadius: 8, padding: "6px 14px", textDecoration: "none" }}>
                          詳細レポート →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
