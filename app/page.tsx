"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";

/* ── デザイントークン ── */
const V = {
  navy:    "#1C2B4A",
  navyLt:  "#EBF0FA",
  green:   "#4DB689",
  greenLt: "#EBF8F3",
  greenDk: "#2E8B63",
  coral:   "#FF7B7B",
  coralLt: "#FFF0F0",
  pink:    "#FF8C80",
  blue:    "#4A87D5",
  blueLt:  "#EBF4FF",
  amber:   "#F59E0B",
  bg:      "#F7F8FC",
  surface: "#FFFFFF",
  ink:     "#1A2332",
  ink2:    "#4A5568",
  ink3:    "#8A9BAB",
  border:  "#E8ECF0",
} as const;

/* ── 風景イラスト（SVG） ── */
function LandscapeIllustration() {
  return (
    <svg viewBox="0 0 440 300" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8E8F5" />
          <stop offset="45%" stopColor="#F5DCB0" />
          <stop offset="100%" stopColor="#D4EEC5" />
        </linearGradient>
        <linearGradient id="water-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8CCDE" />
          <stop offset="100%" stopColor="#7BAFC5" />
        </linearGradient>
        <radialGradient id="sun-g" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFE060" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#FFD080" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFD080" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 空 */}
      <rect x="0" y="0" width="440" height="220" fill="url(#sky-g)" rx="0" />

      {/* 太陽 */}
      <circle cx="330" cy="75" r="56" fill="url(#sun-g)" />
      <circle cx="330" cy="75" r="26" fill="#FFD060" fillOpacity="0.75" />

      {/* 遠い丘 */}
      <path d="M0 165 Q70 118 150 140 Q230 115 310 135 Q360 122 440 138 L440 215 L0 215 Z"
        fill="#BED0A8" fillOpacity="0.75" />

      {/* 水面 */}
      <rect x="0" y="205" width="440" height="95" fill="url(#water-g)" fillOpacity="0.88" />

      {/* 水面の光の揺れ */}
      <line x1="30" y1="220" x2="130" y2="220" stroke="white" strokeWidth="1.2" strokeOpacity="0.35" />
      <line x1="60" y1="235" x2="190" y2="235" stroke="white" strokeWidth="0.9" strokeOpacity="0.28" />
      <line x1="20" y1="252" x2="140" y2="252" stroke="white" strokeWidth="0.7" strokeOpacity="0.2" />

      {/* 岸辺 */}
      <path d="M0 202 Q110 195 220 198 Q330 192 440 202 L440 215 L0 215 Z"
        fill="#A8C090" fillOpacity="0.9" />

      {/* 石段 */}
      <ellipse cx="210" cy="206" rx="14" ry="5" fill="#C8C0A0" />
      <ellipse cx="230" cy="210" rx="11" ry="4" fill="#D0C8A8" />
      <ellipse cx="196" cy="211" rx="9" ry="3.5" fill="#BEB8A0" />

      {/* 木（右） */}
      <rect x="388" y="78" width="13" height="128" rx="3" fill="#8B6A2A" fillOpacity="0.8" />
      <ellipse cx="394" cy="55" rx="38" ry="50" fill="#5A9B4A" fillOpacity="0.9" />
      <ellipse cx="376" cy="80" rx="24" ry="30" fill="#4A8B3A" fillOpacity="0.75" />
      <ellipse cx="410" cy="72" rx="22" ry="26" fill="#6AAB58" fillOpacity="0.7" />

      {/* 葉のディテール */}
      <circle cx="378" cy="42" r="8" fill="#70BB58" fillOpacity="0.6" />
      <circle cx="410" cy="48" r="7" fill="#60AB48" fillOpacity="0.5" />

      {/* 人物（右向き、座っている） */}
      {/* 頭 */}
      <circle cx="248" cy="183" r="10" fill="#D4A080" />
      {/* 髪 */}
      <ellipse cx="248" cy="176" rx="10" ry="8" fill="#3A2820" />
      <path d="M238 180 Q236 188 240 192" fill="#3A2820" />
      <ellipse cx="256" cy="178" rx="5" ry="7" fill="#3A2820" fillOpacity="0.6" />
      {/* 体 */}
      <path d="M238 192 Q246 186 258 192 Q264 204 256 214 L242 214 Q234 204 238 192 Z"
        fill="#E8DDD5" />
      {/* 脚（曲げた状態） */}
      <path d="M240 212 Q232 222 240 228 Q248 224 246 212 Z" fill="#A0B0C0" />
      <path d="M254 212 Q262 222 254 228 Q246 224 248 212 Z" fill="#A0B0C0" />
      {/* 腕 */}
      <path d="M258 196 Q270 200 268 208" fill="none" stroke="#D4A080" strokeWidth="5" strokeLinecap="round" />

      {/* 草 */}
      <path d="M60 205 Q62 196 64 205" stroke="#80A060" strokeWidth="1.5" fill="none" />
      <path d="M68 207 Q70 198 72 207" stroke="#70A050" strokeWidth="1.5" fill="none" />
      <path d="M76 204 Q78 197 80 204" stroke="#88A868" strokeWidth="1.5" fill="none" />
      <path d="M300 200 Q302 191 304 200" stroke="#80A060" strokeWidth="1.5" fill="none" />
      <path d="M308 202 Q310 193 312 202" stroke="#70A050" strokeWidth="1.5" fill="none" />

      {/* 浮かぶ光の粒 */}
      <circle cx="120" cy="160" r="2" fill="#FFE080" fillOpacity="0.5" />
      <circle cx="180" cy="145" r="1.5" fill="#FFE080" fillOpacity="0.4" />
      <circle cx="260" cy="155" r="1.8" fill="#FFE080" fillOpacity="0.45" />
    </svg>
  );
}

/* ── 円形プログレス ── */
function CircularProgress({ value, max }: { value: number; max: number }) {
  const r = 38, cx = 52, cy = 52, sw = 7;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = c * pct;
  return (
    <svg viewBox="0 0 104 104" width={104} height={104}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E8ECF0" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={V.green} strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy - 7} textAnchor="middle" fontWeight={800} fontSize={24} fill={V.navy}>{value}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={13} fill={V.ink3}>/ {max}</text>
    </svg>
  );
}

/* ── ホームページ ── */
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

  const weekCount = (() => {
    if (!mounted) return 0;
    const cutoff = Date.now() - 7 * 24 * 3600 * 1000;
    return history.filter(r => new Date(r.savedAt).getTime() > cutoff).length;
  })();
  const weekGoal = 3;

  // 今週の期間表示
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmtMD = (d: Date) => `${d.getMonth()+1}/${d.getDate()}`;
  const WDAYS = ["日","月","火","水","木","金","土"];
  const weekRange = `${fmtMD(mon)}（${WDAYS[mon.getDay()]}）〜${fmtMD(sun)}（${WDAYS[sun.getDay()]}）`;

  // 今日のテーマ（最新セッションのシナリオタイトル、または日替わり）
  const DAILY_TOPICS = [
    "深い傾聴で信頼を育む",
    "オープン質問で可能性を広げる",
    "共感の言葉でつながりを作る",
    "目標を一緒に描く力",
    "部下のモチベーションを引き出す",
    "コンフリクトを成長に変える",
    "強みを引き出すフィードバック",
  ];
  const todayTopic = lastSession?.session.scenario.title ?? DAILY_TOPICS[now.getDay()];
  const todayDesc  = lastSession?.session.scenario.description ?? "コーチングの一歩を積み重ねましょう。";

  // 前回より良くなったこと
  const improvement = lastSession?.evaluation.improvements[0] ?? null;

  return (
    <main style={{ minHeight: "calc(100vh - 64px)", background: V.bg, padding: "28px 24px 60px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* ═══ ヒーローカード ═══ */}
        <div
          style={{
            background: V.surface,
            borderRadius: 20,
            boxShadow: "0 2px 12px rgba(26,35,50,0.07)",
            border: `1px solid ${V.border}`,
            display: "flex",
            alignItems: "stretch",
            overflow: "hidden",
            marginBottom: 20,
            minHeight: 260,
          }}
        >
          {/* テキスト側 */}
          <div style={{ flex: 1, padding: "40px 40px 40px 44px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
            {/* スパークル */}
            <div style={{ fontSize: 24, marginBottom: 12 }}>✦</div>

            <h1
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: V.navy,
                lineHeight: 1.25,
                margin: "0 0 14px",
                letterSpacing: "-0.02em",
              }}
            >
              今日のコーチング練習
            </h1>

            <p
              style={{
                fontSize: 14,
                color: V.ink2,
                lineHeight: 1.85,
                margin: "0 0 28px",
                maxWidth: 380,
              }}
            >
              たった10〜12分で、コーチングの一歩を積み重ねましょう。
              <br />
              あなたの「聴く力」は、確実に育っています。
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/session"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: V.navy,
                  color: "white",
                  padding: "13px 28px",
                  borderRadius: 100,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: "none",
                  boxShadow: `0 6px 20px -6px ${V.navy}60`,
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
                    background: "transparent",
                    border: `1.5px solid ${V.border}`,
                    color: V.ink2,
                    padding: "13px 24px",
                    borderRadius: 100,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: "none",
                  }}
                >
                  ⏰ 前回の続き
                </Link>
              )}
            </div>
          </div>

          {/* イラスト側 */}
          <div
            style={{
              width: 420,
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <LandscapeIllustration />
          </div>
        </div>

        {/* ═══ 3枚スタットカード ═══ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 16,
            marginBottom: 16,
          }}
        >
          {/* 今週の一歩 */}
          <div
            style={{
              background: V.surface,
              border: `1px solid ${V.border}`,
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 4px rgba(26,35,50,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, background: V.greenLt, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.green} strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: V.ink2 }}>今週の一歩</span>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
              <CircularProgress value={mounted ? weekCount : 0} max={weekGoal} />
            </div>

            <div
              style={{
                textAlign: "center",
                fontSize: 13,
                fontWeight: 700,
                color: V.greenDk,
                marginBottom: 8,
              }}
            >
              {mounted && weekCount >= weekGoal
                ? "🎉 今週の目標達成！"
                : `あと${weekGoal - (mounted ? weekCount : 0)}回で今週の目標達成です！`}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={V.ink3} strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span style={{ fontSize: 11, color: V.ink3 }}>期間: {weekRange}</span>
            </div>
          </div>

          {/* 今日のテーマ */}
          <div
            style={{
              background: V.surface,
              border: `1px solid ${V.border}`,
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 4px rgba(26,35,50,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, background: V.blueLt, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.blue} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: V.ink2 }}>今日のテーマ</span>
            </div>

            <div
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: V.navy,
                lineHeight: 1.4,
                marginBottom: 12,
                letterSpacing: "-0.02em",
              }}
            >
              {todayTopic}
            </div>

            <p style={{ fontSize: 12, color: V.ink3, lineHeight: 1.7, marginBottom: 14 }}>
              {todayDesc}
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: V.blueLt,
                borderRadius: 100,
                padding: "5px 12px",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill={V.blue}>
                <path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              <span style={{ fontSize: 11, color: V.blue, fontWeight: 600 }}>おすすめ練習時間: 10〜12分</span>
            </div>
          </div>

          {/* 前回より良くなったこと */}
          <div
            style={{
              background: V.surface,
              border: `1px solid ${V.border}`,
              borderRadius: 16,
              padding: "24px",
              boxShadow: "0 1px 4px rgba(26,35,50,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, background: "#FFF0F0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={V.coral}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: V.ink2 }}>前回より良くなったこと</span>
            </div>

            {mounted && improvement ? (
              <>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: "#FFF0F0",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    margin: "0 auto 12px",
                  }}
                >
                  ❤️
                </div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: V.ink,
                    lineHeight: 1.6,
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  {improvement}
                </p>
                {scoreDiff !== null && scoreDiff > 0 && (
                  <p style={{ fontSize: 12, color: V.ink3, textAlign: "center" }}>
                    その調子です。継続が力になります。
                  </p>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🌱</div>
                <p style={{ fontSize: 13, color: V.ink3, lineHeight: 1.7 }}>
                  セッションを完了すると
                  <br />
                  成長の記録が表示されます
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ═══ プライバシーストリップ ═══ */}
        <div
          style={{
            background: V.surface,
            border: `1px solid ${V.border}`,
            borderRadius: 12,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 1px 3px rgba(26,35,50,0.04)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: V.greenLt,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={V.green} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span style={{ fontSize: 13, color: V.ink2, lineHeight: 1.6 }}>
            会話内容はあなたの成長のためだけに使われます。プライバシーを大切に、安心してご利用いただけます。
          </span>
        </div>
      </div>
    </main>
  );
}
