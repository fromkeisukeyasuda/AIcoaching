"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

const GOALS = [
  "質問力を高める",
  "傾聴力を高める",
  "共感力を磨く",
  "目標設定をサポートする",
  "アクションを促進する",
  "総合的なスキルアップ",
];

const ALL_THEMES = [
  "マネジメント", "傾聴", "目標設定", "キャリア相談", "チームビルディング",
  "コンフリクト解決", "モチベーション", "フィードバック", "自己啓発", "ワークライフバランス",
];

const QUOTES = [
  { text: "コーチングとは、人が自分自身の答えを見つける手助けをすることです。", author: "ジョン・ウィットモア" },
  { text: "質問は答えよりも強力だ。なぜなら、質問はその人自身の思考を動かすから。", author: "Tim Ferriss" },
  { text: "聞くことは、話すことと同じくらい重要なスキルです。", author: "ブレネー・ブラウン" },
  { text: "人は変化を求めているが、変えられることは望まない。", author: "マーク・トウェイン" },
];

/* ── Toggle コンポーネント ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 13,
        background: checked ? V.green : "#D1D5DB",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          transition: "left 0.2s",
        }}
      />
    </div>
  );
}

export default function MyPage() {
  const [goal, setGoal] = useState(GOALS[0]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>(["マネジメント", "傾聴", "目標設定"]);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    try {
      const raw = localStorage.getItem("mypageSettings");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.goal) setGoal(s.goal);
        if (typeof s.voiceEnabled === "boolean") setVoiceEnabled(s.voiceEnabled);
        if (typeof s.autoSave === "boolean") setAutoSave(s.autoSave);
        if (Array.isArray(s.favoriteThemes)) setFavoriteThemes(s.favoriteThemes);
      }
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    localStorage.setItem("mypageSettings", JSON.stringify({ goal, voiceEnabled, autoSave, favoriteThemes }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleTheme(theme: string) {
    setFavoriteThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  }

  return (
    <main style={{ minHeight: "calc(100vh - 60px)", background: V.bg, paddingBottom: 64 }}>

      {/* ─── プロフィールバナー ─── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${V.navy} 0%, #2D4070 100%)`,
          padding: "0 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 装飾 */}
        <div
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(77,182,137,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: -80,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(77,182,137,0.05)",
          }}
        />

        <div style={{ maxWidth: 900, margin: "0 auto", paddingTop: 40, paddingBottom: 40, position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* アバター */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: V.green,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40,
                boxShadow: "0 4px 16px rgba(77,182,137,0.4)",
                flexShrink: 0,
              }}
            >
              🧑‍💼
            </div>
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(77,182,137,0.15)",
                  border: "1px solid rgba(77,182,137,0.3)",
                  borderRadius: 100,
                  padding: "3px 10px",
                  marginBottom: 8,
                }}
              >
                <span style={{ color: V.green, fontSize: 11, fontWeight: 600 }}>コーチ見習い</span>
              </div>
              <div style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                マイページ
              </div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                練習の目標と設定を管理できます
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── コンテンツ ─── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 24px", display: "grid", gap: 20 }}>

        {/* 練習の目標 */}
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: V.navy, marginBottom: 4 }}>
              🎯 練習の目標
            </div>
            <div style={{ fontSize: 13, color: V.ink3 }}>今の練習で伸ばしたいスキルを選んでください</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => setGoal(g)}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `2px solid ${goal === g ? V.green : V.border}`,
                  background: goal === g ? V.greenLt : V.surface,
                  color: goal === g ? V.green : V.ink2,
                  fontWeight: goal === g ? 700 : 400,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                }}
              >
                {goal === g && (
                  <span style={{ marginRight: 6 }}>✓</span>
                )}
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* サポート設定 */}
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: V.navy, marginBottom: 4 }}>
              ⚙️ サポート設定
            </div>
            <div style={{ fontSize: 13, color: V.ink3 }}>コーチングの補助機能を設定します</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                icon: "🔊",
                label: "音声読み上げ（TTS）",
                desc: "AIクライアントの返答を音声で読み上げます。VOICEVOXが必要です。",
                checked: voiceEnabled,
                onChange: setVoiceEnabled,
              },
              {
                icon: "💾",
                label: "評価を自動保存",
                desc: "セッション終了後、評価結果を自動的に履歴に保存します。",
                checked: autoSave,
                onChange: setAutoSave,
              },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "16px 0",
                  borderBottom: i < arr.length - 1 ? `1px solid ${V.border}` : "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: V.bg,
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: V.ink, marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: V.ink3 }}>{item.desc}</div>
                </div>
                <Toggle checked={item.checked} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* お気に入りテーマ */}
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: V.navy, marginBottom: 4 }}>
              ⭐ お気に入りテーマ
            </div>
            <div style={{ fontSize: 13, color: V.ink3 }}>
              よく練習するシナリオのテーマを選んでください（複数可）
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_THEMES.map((theme) => {
              const active = favoriteThemes.includes(theme);
              return (
                <button
                  key={theme}
                  onClick={() => toggleTheme(theme)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 100,
                    border: `1.5px solid ${active ? V.navy : V.border}`,
                    background: active ? V.navy : V.surface,
                    color: active ? "white" : V.ink2,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {active && "✓ "}{theme}
                </button>
              );
            })}
          </div>
        </div>

        {/* プライバシー */}
        <div style={{ ...card, padding: "24px 28px" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: V.navy, marginBottom: 4 }}>
              🔒 プライバシー
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                background: V.bg,
                borderRadius: 12,
                padding: "14px 16px",
                fontSize: 13,
                color: V.ink2,
                lineHeight: 1.7,
              }}
            >
              <strong style={{ color: V.navy }}>データの保存場所:</strong> すべての会話・評価データはブラウザのローカルストレージにのみ保存されます。外部サーバーへの個人データ送信は行いません。
            </div>
            <button
              onClick={() => {
                if (confirm("すべての練習履歴・設定を削除しますか？この操作は取り消せません。")) {
                  localStorage.removeItem("sessionHistory");
                  localStorage.removeItem("coachingSession");
                  localStorage.removeItem("mypageSettings");
                  localStorage.removeItem("customScenarios");
                  alert("データを削除しました。");
                }
              }}
              style={{
                alignSelf: "flex-start",
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${V.coral}`,
                background: V.coralLt,
                color: V.coral,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🗑 すべてのデータを削除
            </button>
          </div>
        </div>

        {/* 名言カード */}
        <div
          style={{
            background: `linear-gradient(135deg, ${V.navy} 0%, #2D4070 100%)`,
            borderRadius: 16,
            padding: "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -20,
              top: -20,
              fontSize: 120,
              opacity: 0.05,
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            "
          </div>
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 32, lineHeight: 1, marginBottom: 12 }}>
            "
          </div>
          <p style={{ color: "rgba(255,255,255,0.88)", fontSize: 16, lineHeight: 1.8, marginBottom: 16, fontStyle: "italic" }}>
            {quote.text}
          </p>
          <div style={{ color: V.green, fontSize: 13, fontWeight: 600 }}>
            — {quote.author}
          </div>
        </div>

        {/* 保存ボタン */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Link
            href="/"
            style={{
              padding: "12px 22px",
              borderRadius: 12,
              border: `1px solid ${V.border}`,
              background: V.surface,
              color: V.ink2,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            ← ホームへ
          </Link>
          <button
            onClick={saveSettings}
            style={{
              padding: "12px 28px",
              borderRadius: 12,
              border: "none",
              background: saved ? V.green : V.navy,
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "background 0.2s",
            }}
          >
            {saved ? "✓ 保存しました！" : "設定を保存する"}
          </button>
        </div>
      </div>
    </main>
  );
}
