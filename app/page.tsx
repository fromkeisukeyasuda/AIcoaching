"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";

/* ── デザイントークン ── */
const V = {
  navy:    "#F5F1FF",
  navyLt:  "rgba(244,114,182,0.14)",
  green:   "#5FD3A0",
  greenLt: "rgba(95,211,160,0.14)",
  greenDk: "#7EE0B5",
  coral:   "#FF8A80",
  coralLt: "rgba(255,138,128,0.14)",
  pink:    "#F472B6",
  blue:    "#7DB3FF",
  blueLt:  "rgba(125,179,255,0.16)",
  amber:   "#FBBF24",
  bg:      "rgba(255,255,255,0.05)",
  surface: "rgba(255,255,255,0.045)",
  ink:     "#FFFFFF",
  ink2:    "#CFC9E4",
  ink3:    "#8F8AA8",
  border:  "rgba(255,255,255,0.07)",
  accent:  "linear-gradient(135deg, #F472B6 0%, #D946EF 100%)",
  accentShadow: "0 8px 20px -8px rgba(217,70,239,0.6)",
} as const;

/* ── 円形プログレス ── */
function CircularProgress({ value, max }: { value: number; max: number }) {
  const r = 38, cx = 52, cy = 52, sw = 7;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const dash = c * pct;
  return (
    <svg viewBox="0 0 104 104" width={132} height={132} className="tnum">
      <defs><linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#F9A8D4" /><stop offset="100%" stopColor="#D946EF" /></linearGradient></defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#ring-g)" strokeWidth={sw}
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

  const stagger = (n: number) => ({ ["--i" as string]: n } as React.CSSProperties);
  const glassCard: React.CSSProperties = { borderRadius: 28, padding: 28, position: "relative", overflow: "hidden" };
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: V.ink3, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 };

  return (
    <main className="screen-minh rs-main" style={{ padding: "40px 32px 96px" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>

        {/* ═══ ヒーロー ═══ */}
        <section className="home-hero" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)", gap: 40, alignItems: "center", minHeight: 520, padding: "24px 0 48px" }}>
          <div>
            <h1 className="reveal home-h1" style={{ ...stagger(1), fontSize: "clamp(40px, 6.4vw, 80px)", lineHeight: 1.06, fontWeight: 800, letterSpacing: "-0.035em", margin: "0" }}>
              聴く力を、<br />
              <span className="text-grad">毎日すこしずつ。</span>
            </h1>

            <p className="reveal" style={{ ...stagger(2), fontSize: 17, lineHeight: 1.9, color: V.ink2, margin: "26px 0 0", maxWidth: 460 }}>
              AIの相談者を相手に面談を練習して、すぐに評価をもらえる。
              {mounted && lastSession ? "前回の続きから、そのまま再開できます。" : "気軽に相談できるコーチもいて、考えごとの整理にも使えます。"}
            </p>

            <div className="reveal" style={{ ...stagger(3), display: "flex", gap: 12, flexWrap: "wrap", marginTop: 34 }}>
              <Link href="/session" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: V.accent, color: "white", padding: "16px 30px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: V.accentShadow }}>
                練習をはじめる
              </Link>
              <Link href="/talk" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: V.ink2, padding: "16px 26px", borderRadius: 999, fontWeight: 600, fontSize: 15, textDecoration: "none", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}>
                コーチに相談する
              </Link>
            </div>
          </div>

          {/* キャラクターの重なり（非対称） */}
          <div className="reveal home-cast" style={{ ...stagger(2), position: "relative", height: 500 }} aria-hidden>
            <div style={{ position: "absolute", inset: "8% 6% 4% 10%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(217,70,239,0.38), transparent 72%)", filter: "blur(40px)" }} />
            {[
              { src: "/characters/sato_smile.webp", w: 46, top: 2, left: 3, rot: -9, z: 1 },
              { src: "/characters/tanaka_smile.webp", w: 46, top: 12, left: 51, rot: 7, z: 2 },
              { src: "/characters/JO_smile.webp", w: 46, top: 45, left: 24, rot: -2, z: 3 },
            ].map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={c.src} alt="" style={{ position: "absolute", top: `${c.top}%`, left: `${c.left}%`, width: `${c.w}%`, aspectRatio: "1 / 1.08", objectFit: "cover", objectPosition: "50% 18%", borderRadius: 32, transform: `rotate(${c.rot}deg)`, zIndex: c.z, boxShadow: "0 40px 70px -30px rgba(10,4,30,0.95), 0 0 0 1px rgba(255,255,255,0.12)" }} />
            ))}
            <div className="glass" style={{ position: "absolute", right: "2%", bottom: "6%", zIndex: 5, borderRadius: 20, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>🎧</span>
              <div>
                <div style={{ fontSize: 12, color: V.ink3 }}>今週の練習</div>
                <div className="tnum" style={{ fontSize: 20, fontWeight: 800 }}>{mounted ? weekCount : 0}<span style={{ fontSize: 13, color: V.ink3, fontWeight: 600 }}> / {weekGoal} 回</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ ベント（大きさの違うカード） ═══ */}
        <section className="home-bento" style={{ display: "grid", gridTemplateColumns: "repeat(12, minmax(0,1fr))", gap: 18 }}>

          {/* 今週の一歩 */}
          <div className="reveal glass lift rs-col-12" style={{ ...stagger(4), ...glassCard, gridColumn: "span 5", display: "flex", flexDirection: "column" }}>
            <div style={label}>今週の一歩</div>
            <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1 }}>
              <CircularProgress value={mounted ? weekCount : 0} max={weekGoal} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.35, letterSpacing: "-0.02em" }}>
                  {mounted && weekCount >= weekGoal ? "今週の目標を達成" : `あと${weekGoal - (mounted ? weekCount : 0)}回で達成`}
                </div>
                <div style={{ marginTop: 8, fontSize: 12.5, color: V.ink3 }}>{weekRange}</div>
              </div>
            </div>
          </div>

          {/* 今日のテーマ */}
          <div className="reveal glass lift rs-col-12" style={{ ...stagger(5), ...glassCard, gridColumn: "span 7", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 220 }}>
            <div style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(124,58,237,0.45), transparent)", filter: "blur(10px)" }} />
            <div style={{ ...label, position: "relative" }}>今日のテーマ</div>
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: "clamp(24px, 3vw, 34px)", fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.03em" }}>{todayTopic}</div>
              <p style={{ margin: "12px 0 0", fontSize: 14, color: V.ink2, lineHeight: 1.8, maxWidth: 440 }}>{todayDesc}</p>
            </div>
            <Link href="/session" className="btn-ghost" style={{ position: "relative", alignSelf: "flex-start", marginTop: 20, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, color: "#F9A8D4", fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: "inset 0 0 0 1px rgba(244,114,182,0.35)" }}>
              このテーマで練習する
            </Link>
          </div>

          {/* 前回より良くなったこと */}
          <div className="reveal glass lift rs-col-12" style={{ ...stagger(6), ...glassCard, gridColumn: "span 7" }}>
            <div style={label}>前回より良くなったこと</div>
            {mounted && improvement ? (
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 16, background: V.navyLt, display: "grid", placeItems: "center", fontSize: 26 }}>✨</div>
                <div>
                  <p style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.6 }}>{improvement}</p>
                  {scoreDiff !== null && scoreDiff > 0 && (
                    <p className="tnum" style={{ margin: "8px 0 0", fontSize: 13, color: V.green, fontWeight: 600 }}>前回より +{scoreDiff} 点。継続が力になります。</p>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 16, background: "rgba(255,255,255,0.06)", display: "grid", placeItems: "center", fontSize: 26 }}>🌱</div>
                <p style={{ margin: 0, fontSize: 15, color: V.ink2, lineHeight: 1.8 }}>
                  最初の練習を終えると、ここに成長の記録が出ます。<br />
                  <Link href="/session" style={{ color: "#F9A8D4", fontWeight: 700, textDecoration: "none" }}>はじめの1回をやってみる</Link>
                </p>
              </div>
            )}
          </div>

          {/* コーチと話す */}
          <Link href="/talk" className="reveal lift rs-col-12" style={{ ...stagger(7), ...glassCard, gridColumn: "span 5", textDecoration: "none", color: "inherit", background: "linear-gradient(135deg, rgba(217,70,239,0.28), rgba(124,58,237,0.22))", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 30px 50px -30px rgba(217,70,239,0.55)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 160 }}>
            <div style={label}>CONSULT</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.35 }}>JOとYUKOに、<br />気軽に相談してみる</div>
              <div style={{ marginTop: 10, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>話した内容は残るので、続きからいつでも相談できます</div>
            </div>
          </Link>
        </section>

        <p className="reveal" style={{ ...stagger(8), margin: "28px 4px 0", fontSize: 12.5, color: V.ink3, lineHeight: 1.8, display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden>🔒</span>
          会話の内容は、あなたの成長のためだけに使われます。
        </p>
      </div>
    </main>
  );
}
