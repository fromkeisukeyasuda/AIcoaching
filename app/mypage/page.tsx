"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ── デザイントークン ── */
const V = {
  navy:    "#1C2B4A",
  green:   "#4DB689",
  greenLt: "#EBF8F3",
  greenDk: "#2E8B63",
  coral:   "#F07268",
  coralLt: "#FEF3F2",
  amber:   "#F59E0B",
  bg:      "#F4F7FA",
  surface: "#FFFFFF",
  ink:     "#1A2332",
  ink2:    "#4A5568",
  ink3:    "#8A9BAB",
  border:  "#E8ECF0",
  sans:    '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  round:   '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif',
} as const;

const card: React.CSSProperties = {
  background: V.surface,
  border: `1px solid ${V.border}`,
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(26,35,50,0.05)",
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

/* ── プロフィールイラスト (SVG) ── */
function ProfileIllustration() {
  return (
    <svg viewBox="0 0 260 180" width="260" height="180" aria-hidden="true">
      {/* 空 */}
      <defs>
        <linearGradient id="mp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F4FC" />
          <stop offset="100%" stopColor="#F0F8FF" />
        </linearGradient>
        <linearGradient id="mp-hill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8E6C9" />
          <stop offset="100%" stopColor="#A5D6A7" />
        </linearGradient>
      </defs>
      <rect width="260" height="180" fill="url(#mp-sky)" rx="12" />
      {/* 太陽 */}
      <circle cx="200" cy="38" r="22" fill="#FDD835" opacity="0.8" />
      <circle cx="200" cy="38" r="16" fill="#FFF176" />
      {/* 雲 */}
      <ellipse cx="60" cy="34" rx="28" ry="12" fill="white" opacity="0.85" />
      <ellipse cx="80" cy="30" rx="20" ry="10" fill="white" opacity="0.9" />
      <ellipse cx="42" cy="36" rx="16" ry="8" fill="white" opacity="0.8" />
      {/* 遠景の丘 */}
      <ellipse cx="130" cy="140" rx="150" ry="55" fill="#B2DFDB" />
      <ellipse cx="10" cy="150" rx="80" ry="45" fill="url(#mp-hill)" />
      <ellipse cx="240" cy="155" rx="80" ry="40" fill="#A5D6A7" />
      {/* 地面 */}
      <rect y="142" width="260" height="38" fill="#81C784" rx="0" />
      {/* 木 */}
      <rect x="36" y="110" width="6" height="32" fill="#6D4C41" rx="2" />
      <ellipse cx="39" cy="104" rx="18" ry="20" fill="#4CAF50" />
      <ellipse cx="39" cy="98" rx="12" ry="14" fill="#66BB6A" />
      {/* 木2 */}
      <rect x="210" y="115" width="5" height="27" fill="#6D4C41" rx="2" />
      <ellipse cx="213" cy="109" rx="15" ry="17" fill="#388E3C" />
      <ellipse cx="213" cy="104" rx="10" ry="12" fill="#4CAF50" />
      {/* 人物 (コーチ) */}
      <circle cx="130" cy="108" r="12" fill="#FFCC80" />
      <rect x="120" y="119" width="20" height="23" fill={V.navy} rx="4" />
      <rect x="116" y="121" width="7" height="14" fill={V.navy} rx="3" />
      <rect x="137" y="121" width="7" height="14" fill={V.navy} rx="3" />
      {/* 腕を広げてる */}
      <line x1="116" y1="124" x2="106" y2="132" stroke={V.navy} strokeWidth="4" strokeLinecap="round" />
      <line x1="144" y1="124" x2="154" y2="132" stroke={V.navy} strokeWidth="4" strokeLinecap="round" />
      {/* 脚 */}
      <rect x="123" y="140" width="6" height="18" fill="#37474F" rx="3" />
      <rect x="131" y="140" width="6" height="18" fill="#37474F" rx="3" />
      {/* スターバースト */}
      <circle cx="165" cy="95" r="5" fill={V.green} opacity="0.6" />
      <circle cx="95" cy="100" r="4" fill={V.amber} opacity="0.5" />
    </svg>
  );
}

/* ── 名言イラスト (SVG) ── */
function QuoteIllustration() {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
      <defs>
        <linearGradient id="qi-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(77,182,137,0.2)" />
          <stop offset="100%" stopColor="rgba(77,182,137,0.05)" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="55" fill="url(#qi-grad)" />
      {/* 本 */}
      <rect x="30" y="42" width="60" height="44" fill="white" rx="4" opacity="0.9" />
      <rect x="30" y="42" width="30" height="44" fill="#E8ECF0" rx="4" />
      <line x1="60" y1="42" x2="60" y2="86" stroke="#C5CDD6" strokeWidth="1.5" />
      {/* 文字ライン */}
      <line x1="36" y1="56" x2="56" y2="56" stroke={V.ink3} strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="62" x2="52" y2="62" stroke={V.ink3} strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="68" x2="54" y2="68" stroke={V.ink3} strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="56" x2="84" y2="56" stroke={V.navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="62" x2="80" y2="62" stroke={V.navy} strokeWidth="2" strokeLinecap="round" />
      <line x1="64" y1="68" x2="82" y2="68" stroke={V.navy} strokeWidth="2" strokeLinecap="round" />
      {/* 葉アイコン */}
      <circle cx="90" cy="32" r="14" fill={V.green} opacity="0.7" />
      <path d="M84 32 Q90 24 96 32 Q90 36 84 32Z" fill="white" opacity="0.8" />
    </svg>
  );
}

/* ── トグル ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26, borderRadius: 13,
        background: checked ? V.green : "#D1D5DB",
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
    <main style={{ minHeight: "calc(100vh - 64px)", background: V.bg, paddingBottom: 64, fontFamily: V.sans }}>

      {/* ─── プロフィールカード ─── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 0" }}>
        <div style={{
          ...card,
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          overflow: "hidden",
          position: "relative",
        }}>
          {/* 左: アバター + 情報 */}
          <div style={{ flex: 1 }}>
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
                <div style={{ fontSize: 20, fontWeight: 800, color: V.navy, fontFamily: V.round }}>
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
          <div style={{ flexShrink: 0 }}>
            <ProfileIllustration />
          </div>
        </div>
      </div>

      {/* ─── コンテンツグリッド ─── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 24px", display: "grid", gap: 18 }}>

        {/* サポート設定 */}
        <div style={{ ...card, padding: "24px 28px" }}>
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
        <div style={{ ...card, padding: "24px 28px" }}>
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
                    border: `1.5px solid ${active ? V.navy : V.border}`,
                    background: active ? V.navy : V.surface,
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
        <div style={{
          ...card,
          padding: "24px 28px",
          display: "flex",
          alignItems: "center",
          gap: 24,
          background: `linear-gradient(135deg, #FAFBFF 0%, #F4F7FA 100%)`,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.ink3, letterSpacing: "0.08em", marginBottom: 10 }}>TODAY&apos;S QUOTE</div>
            <div style={{ fontSize: 36, color: V.navy, opacity: 0.15, lineHeight: 0.8, marginBottom: 8, fontFamily: "Georgia, serif" }}>&ldquo;</div>
            <p style={{ fontSize: 14, color: V.ink, lineHeight: 1.9, marginBottom: 12, fontStyle: "italic" }}>
              {quote.text}
            </p>
            <div style={{ fontSize: 12, fontWeight: 600, color: V.green }}>— {quote.author}</div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <QuoteIllustration />
          </div>
        </div>

        {/* プライバシー */}
        <div style={{ ...card, padding: "24px 28px" }}>
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
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Link
            href="/"
            style={{
              padding: "12px 22px", borderRadius: 12,
              border: `1px solid ${V.border}`, background: V.surface,
              color: V.ink2, fontSize: 14, fontWeight: 600,
              textDecoration: "none", display: "inline-flex", alignItems: "center",
            }}
          >
            ← ホームへ
          </Link>
          <button
            onClick={saveSettings}
            style={{
              padding: "12px 28px", borderRadius: 12,
              border: "none",
              background: saved ? V.green : V.navy,
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center",
              gap: 8, transition: "background 0.2s",
              fontFamily: V.sans,
            }}
          >
            {saved ? "✓ 保存しました！" : "設定を保存する"}
          </button>
        </div>
      </div>
    </main>
  );
}
