"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ── デザイントークン ── */
const V = {
  navy:    "#F5F1FF",
  green:   "#5FD3A0",
  greenLt: "rgba(95,211,160,0.14)",
  greenDk: "#7EE0B5",
  coral:   "#FF8A80",
  coralLt: "rgba(255,138,128,0.14)",
  amber:   "#FBBF24",
  bg:      "rgba(255,255,255,0.05)",
  surface: "rgba(255,255,255,0.045)",
  ink:     "#FFFFFF",
  ink2:    "#CFC9E4",
  ink3:    "#8F8AA8",
  border:  "rgba(255,255,255,0.07)",
  sans:    '"Plus Jakarta Sans","Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  round:   '"Plus Jakarta Sans","Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  accent:  "linear-gradient(135deg, #F472B6 0%, #D946EF 100%)",
  accentShadow: "0 8px 20px -8px rgba(217,70,239,0.6)",
} as const;

const card: React.CSSProperties = {
  background: V.surface,
  border: `1px solid ${V.border}`,
  borderRadius: 22,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 40px -28px rgba(8,4,24,0.9)", backdropFilter: "blur(14px)",
};

/* ── 頻度セグメント ── */
const FREQ_OPTIONS = ["週1回", "週2回", "週3回以上"];

/* ── テーマ ── */
const ALL_THEMES = [
  "マネジメント", "傾聴", "目標設定", "キャリア相談", "チームビルディング",
  "コンフリクト解決", "モチベーション", "フィードバック", "自己啓発", "ワークライフバランス",
];

/* ── 名言 ── */
const QUOTES = [
  { text: "コーチングとは、人が自分自身の答えを見つける手助けをすることです。", author: "ジョン・ウィットモア" },
  { text: "質問は答えよりも強力だ。なぜなら、質問はその人自身の思考を動かすから。", author: "Tim Ferriss" },
  { text: "聞くことは、話すことと同じくらい重要なスキルです。", author: "ブレネー・ブラウン" },
  { text: "人は変化を求めているが、変えられることは望まない。", author: "マーク・トウェイン" },
];

/* ── トグル ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26, borderRadius: 13,
        background: checked ? V.green : "rgba(255,255,255,0.18)",
        cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        transition: "left 0.2s",
      }} />
    </div>
  );
}

/* ── セグメントコントロール ── */
function SegmentedControl({
  options, value, onChange,
}: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      display: "inline-flex",
      background: V.bg,
      borderRadius: 12,
      padding: 4,
      gap: 2,
    }}>
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: "8px 18px",
            borderRadius: 9,
            border: "none",
            background: value === opt ? V.surface : "transparent",
            boxShadow: value === opt ? "0 1px 3px rgba(26,35,50,0.12)" : "none",
            color: value === opt ? V.navy : V.ink3,
            fontWeight: value === opt ? 700 : 400,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.15s",
            fontFamily: V.sans,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   メインページ
══════════════════════════════════════════════ */
export default function MyPage() {
  const [freq, setFreq] = useState(FREQ_OPTIONS[0]);
  const [remind, setRemind] = useState(true);
  const [hint, setHint] = useState(true);
  const [voice, setVoice] = useState(false);
  const [favoriteThemes, setFavoriteThemes] = useState<string[]>(["マネジメント", "傾聴", "目標設定"]);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    try {
      const raw = localStorage.getItem("mypageSettings");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.freq) setFreq(s.freq);
        if (typeof s.remind === "boolean") setRemind(s.remind);
        if (typeof s.hint === "boolean") setHint(s.hint);
        if (typeof s.voice === "boolean") setVoice(s.voice);
        if (Array.isArray(s.favoriteThemes)) setFavoriteThemes(s.favoriteThemes);
      }
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    localStorage.setItem("mypageSettings", JSON.stringify({ freq, remind, hint, voice, favoriteThemes }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function toggleTheme(theme: string) {
    setFavoriteThemes(prev =>
      prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
    );
  }

  return (
    <main className="screen-minh" style={{ background: "transparent", paddingBottom: 64, fontFamily: V.sans }}>

      {/* ─── プロフィールカード ─── */}
      <div className="rs-px reveal" style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 32px 0" }}>
        <div className="rs-stack rs-pad" style={{
          ...card,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          overflow: "hidden",
          position: "relative",
        }}>
          {/* 左: アバター + 情報 */}
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
              <div style={{
                width: 70, height: 70, borderRadius: "50%",
                background: V.greenLt, border: `3px solid ${V.green}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 34, flexShrink: 0,
              }}>
                🧑‍💼
              </div>
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: V.greenLt, borderRadius: 100, padding: "3px 10px",
                  marginBottom: 6,
                }}>
                  <span style={{ color: V.greenDk, fontSize: 11, fontWeight: 700 }}>コーチ見習い</span>
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: V.navy, fontFamily: V.round, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                  マイページ
                </div>
                <div style={{ fontSize: 12, color: V.ink3, marginTop: 2 }}>
                  設定と目標を管理できます
                </div>
              </div>
            </div>

            {/* 頻度セグメント */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: V.ink2, marginBottom: 10 }}>
                練習頻度の目標
              </div>
              <SegmentedControl options={FREQ_OPTIONS} value={freq} onChange={setFreq} />
            </div>
          </div>

          {/* 右: イラスト */}
          <div className="rs-hide" aria-hidden style={{ position: "absolute", right: -70, top: -90, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(217,70,239,0.42), rgba(124,58,237,0.18) 60%, transparent)", filter: "blur(8px)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* ─── コンテンツグリッド ─── */}
      <div className="rs-px mypage-grid" style={{ maxWidth: 1120, margin: "0 auto", padding: "18px 32px", display: "grid", gridTemplateColumns: "repeat(12, minmax(0, 1fr))", gap: 18 }}>

        {/* サポート設定 */}
        <div className="reveal rs-col-12" style={{ ...card, padding: "28px 30px", gridColumn: "1 / span 7", gridRow: 1, ["--i" as string]: 1 } as React.CSSProperties}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: V.navy, fontFamily: V.round, marginBottom: 3 }}>
              ⚙️ サポート設定
            </div>
            <div style={{ fontSize: 12, color: V.ink3 }}>コーチング補助機能の設定</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              { icon: "🔔", label: "練習リマインド", desc: "設定した頻度でプッシュ通知をお届けします。", checked: remind, onChange: setRemind },
              { icon: "💡", label: "AIヒント表示",   desc: "練習中にリアルタイムでコーチングのヒントを表示します。", checked: hint,   onChange: setHint   },
              { icon: "🔊", label: "音声読み上げ（TTS）", desc: "クライアントの返答を音声で読み上げます。VOICEVOXが必要です。", checked: voice, onChange: setVoice },
            ].map((item, i, arr) => (
              <div
                key={item.label}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "15px 0",
                  borderBottom: i < arr.length - 1 ? `1px solid ${V.border}` : "none",
                }}
              >
                <div style={{
                  width: 40, height: 40, background: V.bg, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: V.ink, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: V.ink3 }}>{item.desc}</div>
                </div>
                <Toggle checked={item.checked} onChange={item.onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* お気に入りテーマ */}
        <div className="reveal rs-col-12" style={{ ...card, padding: "28px 30px", gridColumn: "1 / span 7", gridRow: 2, ["--i" as string]: 3 } as React.CSSProperties}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: V.navy, fontFamily: V.round, marginBottom: 3 }}>
                ⭐ 練習テーマ
              </div>
              <div style={{ fontSize: 12, color: V.ink3 }}>よく練習するテーマを選択（複数可）</div>
            </div>
            <button style={{
              padding: "7px 14px", borderRadius: 100,
              border: `1.5px dashed ${V.border}`,
              background: V.surface, color: V.ink3,
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: V.sans,
            }}>
              + テーマを追加
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALL_THEMES.map((theme) => {
              const active = favoriteThemes.includes(theme);
              return (
                <button
                  key={theme}
                  onClick={() => toggleTheme(theme)}
                  style={{
                    padding: "7px 14px", borderRadius: 100,
                    border: `1.5px solid ${active ? "#F472B6" : V.border}`,
                    background: active ? V.accent : V.surface,
                    color: active ? "white" : V.ink2,
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    cursor: "pointer", transition: "all 0.15s",
                    fontFamily: V.sans,
                  }}
                >
                  {active && "✓ "}{theme}
                </button>
              );
            })}
          </div>
        </div>

        {/* 今日の名言 */}
        <div className="reveal rs-col-12" style={{
          ...card,
          padding: "30px",
          gridColumn: "8 / span 5",
          gridRow: 1,
          display: "flex",
          alignItems: "center",
          gap: 24,
          background: `linear-gradient(135deg, rgba(244,114,182,0.16) 0%, rgba(124,58,237,0.16) 100%)`,
          ["--i" as string]: 2,
        } as React.CSSProperties}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.ink3, letterSpacing: "0.08em", marginBottom: 10 }}>TODAY&apos;S QUOTE</div>
            <div style={{ fontSize: 36, color: V.navy, opacity: 0.15, lineHeight: 0.8, marginBottom: 8, fontFamily: "Georgia, serif" }}>&ldquo;</div>
            <p style={{ fontSize: 19, fontWeight: 700, color: V.ink, lineHeight: 1.8, marginBottom: 14, letterSpacing: "-0.01em" }}>
              {quote.text}
            </p>
            <div style={{ fontSize: 12, fontWeight: 600, color: V.green }}>— {quote.author}</div>
          </div>
        </div>

        {/* プライバシー */}
        <div className="reveal rs-col-12" style={{ ...card, padding: "28px 30px", gridColumn: "8 / span 5", gridRow: 2, ["--i" as string]: 4 } as React.CSSProperties}>
          <div style={{ fontSize: 15, fontWeight: 700, color: V.navy, fontFamily: V.round, marginBottom: 14 }}>
            🔒 プライバシー
          </div>
          <div style={{
            background: V.bg, borderRadius: 12, padding: "14px 16px",
            fontSize: 13, color: V.ink2, lineHeight: 1.7, marginBottom: 14,
          }}>
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
              padding: "10px 18px", borderRadius: 10,
              border: `1px solid ${V.coral}`, background: V.coralLt,
              color: V.coral, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: V.sans,
            }}
          >
            🗑 すべてのデータを削除
          </button>
        </div>

        {/* 保存ボタン */}
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: 12, paddingTop: 6 }}>
          <Link
            href="/"
            className="btn-ghost"
            style={{
              padding: "13px 24px", borderRadius: 999,
              border: `1px solid ${V.border}`, background: V.surface,
              color: V.ink2, fontSize: 14, fontWeight: 600,
              textDecoration: "none", display: "inline-flex", alignItems: "center",
            }}
          >
            ← ホームへ
          </Link>
          <button
            onClick={saveSettings}
            className="btn-primary"
            style={{
              padding: "13px 30px", borderRadius: 999,
              border: "none",
              background: saved ? V.green : V.accent,
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, transition: "background 0.2s",
              fontFamily: V.sans,
            }}
          >
            {saved ? "✓ 保存しました" : "設定を保存する"}
          </button>
        </div>
      </div>
    </main>
  );
}
