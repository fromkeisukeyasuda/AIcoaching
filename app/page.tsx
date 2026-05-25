"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";

/* ── デザイントークン ── */
const V = {
  navy:    "#1C2B4A",
  green:   "#4DB689",
  greenLt: "#EBF8F3",
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
} as const;

const card: React.CSSProperties = {
  background: V.surface,
  border: `1px solid ${V.border}`,
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(26,35,50,0.05)",
};

/* ── 今週の練習回数 ── */
function weekCount(history: SessionRecord[]) {
  const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
  return history.filter((r) => new Date(r.savedAt).getTime() > cutoff).length;
}

/* ── 今日のテーマ（曜日ローテーション） ── */
const DAILY_THEMES = [
  "深い傾聴を意識する",
  "オープン質問で掘り下げる",
  "感情に寄り添う",
  "目標を一緒に描く",
  "具体的なアクションへ導く",
  "沈黙を味方にする",
  "視点を広げる質問をする",
];

export default function HomePage() {
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem("sessionHistory");
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const lastSession   = history[0] ?? null;
  const lastScore     = lastSession?.evaluation.overallScore ?? null;
  const prevScore     = history[1]?.evaluation.overallScore ?? null;
  const scoreDiff     = lastScore !== null && prevScore !== null ? lastScore - prevScore : null;
  const wCount        = weekCount(history);
  const todayTheme    = DAILY_THEMES[new Date().getDay()];

  return (
    <main
      style={{
        minHeight: "calc(100vh - 60px)",
        background: V.bg,
        padding: "32px 24px 64px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ═══════════════════════════════════
            ヒーローカード
        ═══════════════════════════════════ */}
        <div
          style={{
            background: V.navy,
            borderRadius: 20,
            padding: "36px 40px",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 32,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* 背景装飾 */}
          <div
            style={{
              position: "absolute",
              right: -20,
              top: -30,
              width: 260,
              height: 260,
              borderRadius: "50%",
              background: "rgba(77,182,137,0.06)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 60,
              bottom: -60,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(77,182,137,0.04)",
              pointerEvents: "none",
            }}
          />

          {/* テキスト */}
          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(77,182,137,0.15)",
                border: "1px solid rgba(77,182,137,0.3)",
                borderRadius: 100,
                padding: "4px 12px",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: V.green,
                  borderRadius: "50%",
                  animation: "pulse 2s infinite",
                }}
              />
              <span style={{ color: V.green, fontSize: 12, fontWeight: 600 }}>
                AIコーチングトレーナー
              </span>
            </div>

            <h1
              style={{
                color: "white",
                fontSize: 30,
                fontWeight: 800,
                lineHeight: 1.25,
                marginBottom: 10,
                letterSpacing: "-0.02em",
              }}
            >
              コーチングスキルを
              <br />
              <span style={{ color: V.green }}>AIで磨く</span>
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.58)",
                fontSize: 14,
                lineHeight: 1.75,
                marginBottom: 28,
              }}
            >
              AIクライアントとのリアルな対話を通じて、
              <br />
              プロのコーチングスキルを安心して身につけましょう。
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/session"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: V.green,
                  color: "white",
                  padding: "13px 26px",
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: "0 8px 24px -8px rgba(77,182,137,0.5)",
                  letterSpacing: "-0.01em",
                }}
              >
                ▶ はじめる
              </Link>

              {mounted && lastSession && (
                <Link
                  href="/session"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: "rgba(255,255,255,0.85)",
                    padding: "13px 24px",
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  前回の続き →
                </Link>
              )}
            </div>
          </div>

          {/* キャラクター */}
          <div
            style={{
              flexShrink: 0,
              width: 150,
              height: 150,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 96,
                filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.25))",
                animation: "float 4s ease-in-out infinite",
              }}
            >
              🧑‍💼
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════
            3 枚のスタットカード
        ═══════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {/* 今週の一歩 */}
          <div style={{ ...card, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: V.greenLt,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                📅
              </div>
              <span style={{ color: V.ink2, fontSize: 12, fontWeight: 600 }}>今週の一歩</span>
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 800,
                color: V.navy,
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              {mounted ? wCount : 0}
            </div>
            <div style={{ color: V.ink3, fontSize: 12, marginBottom: 14 }}>セッション完了</div>
            <div>
              <div
                style={{
                  background: V.greenLt,
                  borderRadius: 6,
                  height: 5,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    background: V.green,
                    height: "100%",
                    width: `${Math.min((mounted ? wCount : 0) / 5 * 100, 100)}%`,
                    borderRadius: 6,
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
              <div style={{ color: V.ink3, fontSize: 11, marginTop: 5 }}>目標: 5 セッション/週</div>
            </div>
          </div>

          {/* 今日のテーマ */}
          <div style={{ ...card, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#FEF3F2",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                🎯
              </div>
              <span style={{ color: V.ink2, fontSize: 12, fontWeight: 600 }}>今日のテーマ</span>
            </div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: V.navy,
                lineHeight: 1.4,
                marginBottom: 12,
              }}
            >
              {todayTheme}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#FEF3F2",
                borderRadius: 100,
                padding: "5px 10px",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  background: V.coral,
                  borderRadius: "50%",
                }}
              />
              <span style={{ color: V.coral, fontSize: 11, fontWeight: 600 }}>
                今日のおすすめ練習
              </span>
            </div>
          </div>

          {/* 前回より良くなったこと */}
          <div style={{ ...card, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "#EBF4FF",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                📈
              </div>
              <span style={{ color: V.ink2, fontSize: 12, fontWeight: 600 }}>
                前回より良くなったこと
              </span>
            </div>

            {mounted && scoreDiff !== null ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 4,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 34,
                      fontWeight: 800,
                      color: scoreDiff >= 0 ? V.green : V.coral,
                      lineHeight: 1,
                    }}
                  >
                    {scoreDiff >= 0 ? "+" : ""}
                    {scoreDiff.toFixed(0)}
                  </span>
                  <span style={{ color: V.ink3, fontSize: 13 }}>点</span>
                </div>
                {lastSession?.evaluation.improvements[0] && (
                  <div
                    style={{
                      color: V.ink2,
                      fontSize: 12,
                      lineHeight: 1.6,
                      borderLeft: `2px solid ${V.green}`,
                      paddingLeft: 10,
                    }}
                  >
                    {lastSession.evaluation.improvements[0]}
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: V.ink3, fontSize: 13, lineHeight: 1.7 }}>
                セッションを完了すると
                <br />
                成長の記録が表示されます
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════
            クイックナビゲーション
        ═══════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              href: "/session",
              icon: "💬",
              bg: V.greenLt,
              iconBg: V.green,
              title: "コーチング練習",
              desc: "AIクライアントとリアルなセッション",
              action: "セッション開始",
              actionColor: V.green,
            },
            {
              href: "/history",
              icon: "📊",
              bg: "#EBF4FF",
              iconBg: "#3B82F6",
              title: "ふりかえり",
              desc: "スコア推移と成長を確認する",
              action: "履歴を見る",
              actionColor: "#3B82F6",
            },
            {
              href: "/mypage",
              icon: "⚙️",
              bg: "#F5F3FF",
              iconBg: "#7C3AED",
              title: "マイページ",
              desc: "目標・設定・テーマを管理",
              action: "設定する",
              actionColor: "#7C3AED",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  ...card,
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "transform 0.15s, box-shadow 0.15s",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: item.bg,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: V.navy,
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </div>
                  <div style={{ fontSize: 12, color: V.ink3 }}>{item.desc}</div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: item.actionColor,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {item.action} →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ═══════════════════════════════════
            プライバシー注記
        ═══════════════════════════════════ */}
        <div
          style={{
            ...card,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 12,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
          <span style={{ color: V.ink3, fontSize: 12, lineHeight: 1.5 }}>
            会話データはブラウザのローカルストレージにのみ保存されます。外部サーバーへの個人データ送信はありません。
          </span>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.6; transform:scale(0.9); }
        }
      `}</style>
    </main>
  );
}
