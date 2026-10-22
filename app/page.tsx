"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SessionRecord } from "@/types";
import { getChallenge, getOverall, Challenge } from "@/lib/skills";
import OverallBar from "@/components/OverallBar";
import { getTutorial, TutorialStep } from "@/lib/tutorial";
import { TALK_ENABLED } from "@/lib/features";

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

/* ── ホームページ ── */
export default function HomePage() {
  const stagger = (n: number) => ({ ["--i" as string]: n } as React.CSSProperties);

  // 今日のチャレンジと、現在のレベル（端末内の記録から）
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [overall, setOverall] = useState<number | null>(null);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep | null>(null);
  useEffect(() => {
    try {
      const records: SessionRecord[] = JSON.parse(localStorage.getItem("sessionHistory") ?? "[]");
      const list = Array.isArray(records) ? records : [];
      setChallenge(getChallenge(list));
      setOverall(getOverall(list));
      // すでに練習した人（チュートリアルを始めていない）は、チュートリアルを済んだものとして扱う
      const tp = getTutorial().step;
      setTutorialStep(tp === "welcome" && list.length > 0 ? "done" : tp);
    } catch {
      setChallenge(getChallenge([]));
    }
  }, []);

  return (
    <main className="screen-minh rs-main" style={{ padding: "24px 32px 56px", display: "flex", alignItems: "center" }}>
      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto" }}>

        {/* ═══ ヒーロー ═══ */}
        <section className="home-hero" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,0.95fr)", gap: 40, alignItems: "center", minHeight: 0, padding: 0 }}>
          <div>
            {/* アイコン + 見出し（アイコンは見出しの左） */}
            <div className="home-title-row" style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="reveal home-icon" src="/icons/icon-512.png" alt="RoleMate" width={120} height={120} style={{ ...stagger(0), width: 120, height: 120, flexShrink: 0, borderRadius: 30, display: "block", boxShadow: "0 24px 48px -18px rgba(217,70,239,0.7), 0 0 0 1px rgba(255,255,255,0.1)" }} />
              <h1 className="reveal home-h1" style={{ ...stagger(1), fontSize: "clamp(34px, 4.6vw, 60px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.035em", margin: 0 }}>
                聴く力を、<br />
                <span className="text-grad">毎日すこしずつ。</span>
              </h1>
            </div>

            <p className="reveal" style={{ ...stagger(2), fontSize: 17, lineHeight: 1.9, color: V.ink2, margin: "28px 0 0", maxWidth: 460 }}>
              AIの相談者を相手に面談を練習して、<br className="sm:hidden" />すぐに評価をもらえる。<br className="hidden sm:inline" />
              クイズで、主訴の捉え方や見立ての考え方も学べます。
            </p>

            {/* 今日のチャレンジ（意識することを一言で決めてから、練習をはじめる） */}
            {challenge && tutorialStep === "done" && (
              <div className="reveal" style={{ ...stagger(3), marginTop: 22, maxWidth: 460 }}>
                <OverallBar overall={overall} />
                {/* 左: 今日のチャレンジ / 右: 練習をはじめるボタン */}
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#8F8AA8" }}>今日のチャレンジ</div>
                    <div style={{ marginTop: 2, fontSize: 20, fontWeight: 800, color: "#F5F1FF", letterSpacing: "-0.01em" }}>{challenge.title}</div>
                  </div>
                  <Link href="/session" className="btn-primary" style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", background: V.accent, color: "white", padding: "12px 20px", borderRadius: 999, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: V.accentShadow }}>
                    練習をはじめる
                  </Link>
                </div>
              </div>
            )}

            <div className="reveal" style={{ ...stagger(3), display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
              {tutorialStep !== null && tutorialStep !== "done" ? (
                <>
                  <Link href="/tutorial" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: V.accent, color: "white", padding: "16px 30px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: V.accentShadow }}>
                    {tutorialStep === "welcome" ? "チュートリアルを始める" : "チュートリアルの続きから"}
                  </Link>
                  <Link href="/session" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: V.ink2, padding: "16px 26px", borderRadius: 999, fontWeight: 600, fontSize: 15, textDecoration: "none", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}>
                    練習をはじめる
                  </Link>
                </>
              ) : !(challenge && tutorialStep === "done") && (
                // チュートリアルが済んだあとは、「練習をはじめる」は、今日のチャレンジの右隣にある
                <Link href="/session" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: V.accent, color: "white", padding: "16px 30px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: V.accentShadow }}>
                練習をはじめる
                </Link>
              )}
              {TALK_ENABLED && <Link href="/talk" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: V.ink2, padding: "16px 26px", borderRadius: 999, fontWeight: 600, fontSize: 15, textDecoration: "none", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}>
                コーチに相談する
              </Link>}
            </div>
          </div>

          {/* キャラクターの重なり（非対称） */}
          <div className="reveal home-cast" style={{ ...stagger(2), position: "relative", height: 440 }} aria-hidden>
            <div style={{ position: "absolute", inset: "8% 6% 4% 10%", borderRadius: "50%", background: "radial-gradient(closest-side, rgba(217,70,239,0.38), transparent 72%)", filter: "blur(40px)" }} />
            {[
              { src: "/characters/sato_smile.webp", w: 46, top: 2, left: 3, rot: -9, z: 1 },
              { src: "/characters/tanaka_smile.webp", w: 46, top: 12, left: 51, rot: 7, z: 2 },
              { src: "/characters/JO_smile.webp", w: 46, top: 45, left: 24, rot: -2, z: 3 },
            ].map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={c.src} alt="" style={{ position: "absolute", top: `${c.top}%`, left: `${c.left}%`, width: `${c.w}%`, aspectRatio: "1 / 1.08", objectFit: "cover", objectPosition: "50% 18%", borderRadius: 32, transform: `rotate(${c.rot}deg)`, zIndex: c.z, boxShadow: "0 40px 70px -30px rgba(10,4,30,0.95), 0 0 0 1px rgba(255,255,255,0.12)" }} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
