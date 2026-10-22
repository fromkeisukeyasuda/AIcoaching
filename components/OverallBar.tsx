import { SKILL_TARGET } from "@/lib/skills";

/* 総合スキルのバー（ホームとふりかえりで共通）。
   3層を重ねる: 下から、全体の枠、目標まで（アンバー）、現在（ピンク）。
   どれも両端が丸く、現在の右端の丸みの後ろにアンバーが見えるので、切れ目ができない */
export default function OverallBar({ overall, titleSize = 15 }: { overall: number | null; titleSize?: number }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontSize: titleSize, fontWeight: 800, color: "#F5F1FF" }}>総合スキル</span>
        <span className="tnum" style={{ fontSize: 12.5, color: "#8F8AA8" }}>現在 {overall ?? "—"} / 目標 {SKILL_TARGET}</span>
      </div>
      <div
        role="img"
        aria-label={`総合スキル 現在${overall ?? "未測定"}、目標${SKILL_TARGET}`}
        style={{ position: "relative", marginTop: 10, height: 16, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}
      >
        {overall !== null && overall < SKILL_TARGET && (
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${SKILL_TARGET}%`, borderRadius: 999, background: "#E3AD57" }} />
        )}
        {overall !== null && overall > 0 && (
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${overall}%`, borderRadius: 999, background: "linear-gradient(90deg, #F472B6, #D946EF)" }} />
        )}
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 16, fontSize: 11.5, color: "#CFC9E4" }}>
        <span><span aria-hidden style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#D946EF", marginRight: 6 }} />現在のスコア</span>
        <span><span aria-hidden style={{ display: "inline-block", width: 9, height: 9, borderRadius: "50%", background: "#E3AD57", marginRight: 6 }} />目標までの差</span>
      </div>
    </div>
  );
}
