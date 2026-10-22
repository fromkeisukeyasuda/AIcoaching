"use client";

import Link from "next/link";
import { useMemo } from "react";
import { SessionRecord } from "@/types";
import { computeSkills, getChallenge, getOverall } from "@/lib/skills";
import OverallBar from "@/components/OverallBar";
import SkillRadar from "@/components/SkillRadar";

const T = {
  navy: "#F5F1FF",
  green: "#7EE0B5",
  coral: "#FF8A80",
  ink: "#FFFFFF",
  ink2: "#CFC9E4",
  ink3: "#8F8AA8",
  pink: "#F9A8D4",
  border: "rgba(255,255,255,0.07)",
  accent: "linear-gradient(135deg, #F472B6 0%, #D946EF 100%)",
  accentShadow: "0 8px 20px -8px rgba(217,70,239,0.6)",
};

/** 面談スキルの診断カード。レーダー、強みと伸びしろ、次の一手を出す */
export default function SkillDiagnosis({ records }: { records: SessionRecord[] }) {
  const { axes, advice, hint } = useMemo(() => computeSkills(records), [records]);
  const challenge = useMemo(() => getChallenge(records), [records]);
  const overall = useMemo(() => getOverall(records), [records]);
  const measured = axes.filter((a) => a.value !== null) as (typeof axes[number] & { value: number })[];
  if (measured.length === 0) return null;

  const strongest = measured.reduce((m, a) => (a.value > m.value ? a : m));
  const hasAverage = axes.some((a) => a.average !== null);

  return (
    <section
      aria-label="面談スキルの診断"
      style={{
        background: "rgba(255,255,255,0.045)", border: `1px solid ${T.border}`, borderRadius: 22, padding: "22px 24px", marginBottom: 24,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 40px -28px rgba(8,4,24,0.9)", backdropFilter: "blur(14px)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.navy, letterSpacing: "-0.02em" }}>あなたの面談スキル</h2>
      <p style={{ margin: "4px 0 16px", fontSize: 12, color: T.ink3, lineHeight: 1.7 }}>
        練習の評価・口頭試問・クイズの結果から、6つの視点でまとめました（100点満点）。
      </p>
      <div style={{ marginBottom: 20, maxWidth: 460 }}><OverallBar overall={overall} /></div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "18px 28px", alignItems: "center" }}>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <SkillRadar axes={axes} />
          <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 6, fontSize: 11, color: T.ink3 }}>
            <span><span aria-hidden style={{ display: "inline-block", width: 14, height: 3, borderRadius: 2, background: "#F472B6", marginRight: 6, verticalAlign: "middle" }} />今回</span>
            {hasAverage && <span><span aria-hidden style={{ display: "inline-block", width: 14, borderTop: "2px dashed rgba(255,255,255,0.55)", marginRight: 6, verticalAlign: "middle" }} />これまでの平均</span>}
          </div>
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ borderRadius: 14, padding: "10px 12px", background: "rgba(95,211,160,0.12)" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: T.green, marginBottom: 2 }}>強み</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{strongest.label}<span style={{ marginLeft: 6, fontSize: 12, color: T.ink2, fontWeight: 600 }}>{strongest.value}</span></div>
            </div>
            {advice && (
              <div style={{ borderRadius: 14, padding: "10px 12px", background: "rgba(255,138,128,0.12)" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: T.coral, marginBottom: 2 }}>伸びしろ</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{advice.label}<span style={{ marginLeft: 6, fontSize: 12, color: T.ink2, fontWeight: 600 }}>{measured.find((m) => m.key === advice.key)?.value}</span></div>
              </div>
            )}
          </div>

          {advice && (
            <div style={{ borderRadius: 16, padding: "14px 16px", background: "rgba(244,114,182,0.12)", border: "1px solid rgba(244,114,182,0.25)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.pink, marginBottom: 2 }}>今日のチャレンジ</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.navy, marginBottom: 6 }}>{challenge.title}</div>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: T.ink2, lineHeight: 1.8 }}>{advice.tip}</p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 14px" }}>
                <Link
                  href="/session"
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", padding: "9px 20px", background: T.accent, color: "white", borderRadius: 999, fontWeight: 700, fontSize: 12.5, textDecoration: "none", boxShadow: T.accentShadow }}
                >
                  練習をはじめる
                </Link>
                {advice.cta.href === "/quiz" && (
                  <Link href="/quiz" style={{ fontSize: 12, fontWeight: 700, color: T.pink, textDecoration: "none" }}>{advice.cta.label}</Link>
                )}
              </div>
            </div>
          )}

          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {axes.map((a) => {
              const diff = a.value !== null && a.average !== null ? a.value - a.average : null;
              return (
                <li key={a.key} style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12, color: T.ink2 }}>
                  <span style={{ width: 70, flexShrink: 0, fontWeight: 700 }}>{a.label}</span>
                  <span style={{ width: 34, textAlign: "right", fontWeight: 800, color: a.value === null ? T.ink3 : T.ink }}>{a.value ?? "—"}</span>
                  <span style={{ width: 44, color: diff === null ? T.ink3 : diff >= 0 ? T.green : T.coral, fontSize: 11 }}>{diff === null ? "" : `${diff >= 0 ? "+" : "−"}${Math.abs(diff)}`}</span>
                  <span style={{ color: T.ink3, fontSize: 10.5 }}>{a.source ? `（${a.source}）` : ""}</span>
                </li>
              );
            })}
          </ul>
          {hint && <p style={{ margin: 0, fontSize: 11.5, color: T.ink3, lineHeight: 1.7 }}>{hint}</p>}
        </div>
      </div>
    </section>
  );
}
