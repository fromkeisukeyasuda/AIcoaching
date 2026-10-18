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

  const stagger = (n: number) => ({ ["--i" as string]: n } as React.CSSProperties);

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
              AIの相談者を相手に面談を練習して、すぐに評価をもらえる。<br />
              {mounted && lastSession ? "前回の続きから、そのまま再開できます。" : "気軽に相談できるコーチもいて、考えごとの整理にも使えます。"}
            </p>

            <div className="reveal" style={{ ...stagger(3), display: "flex", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
              <Link href="/session" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: V.accent, color: "white", padding: "16px 30px", borderRadius: 999, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: V.accentShadow }}>
                練習をはじめる
              </Link>
              <Link href="/talk" className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: V.ink2, padding: "16px 26px", borderRadius: 999, fontWeight: 600, fontSize: 15, textDecoration: "none", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14)" }}>
                コーチに相談する
              </Link>
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
