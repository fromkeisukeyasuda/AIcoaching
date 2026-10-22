import { SkillAxis } from "@/lib/skills";

/* 面談スキルのレーダーチャート（6軸）。今回の点数と、これまでの平均を重ねて表示する */
const SIZE = 300;
const C = SIZE / 2;
const R = 92;       // 外枠の半径
const LABEL_R = R + 26;

const point = (i: number, n: number, v: number) => {
  const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
  const r = (R * Math.max(0, Math.min(100, v))) / 100;
  return [C + r * Math.cos(angle), C + r * Math.sin(angle)] as const;
};
const toPath = (pts: (readonly [number, number])[]) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";

export default function SkillRadar({ axes }: { axes: SkillAxis[] }) {
  const n = axes.length;
  const hasAverage = axes.some((a) => a.average !== null);
  const label = axes.map((a) => `${a.label} ${a.value ?? "未測定"}`).join("、");

  return (
    <svg viewBox={`-40 18 ${SIZE + 80} ${SIZE - 20}`} role="img" aria-label={`面談スキルのレーダーチャート。${label}`} style={{ width: "100%", maxWidth: 380, display: "block", margin: "0 auto" }}>
      {/* 目盛り（25・50・75・100） */}
      {[25, 50, 75, 100].map((g) => (
        <path key={g} d={toPath(axes.map((_, i) => point(i, n, g)))} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
      ))}
      {/* 軸 */}
      {axes.map((_, i) => {
        const [x, y] = point(i, n, 100);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(255,255,255,0.10)" strokeWidth={1} />;
      })}

      {/* これまでの平均 */}
      {hasAverage && (
        <path d={toPath(axes.map((a, i) => point(i, n, a.average ?? a.value ?? 0)))} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.5} strokeDasharray="4 3" />
      )}

      {/* 今回 */}
      <path d={toPath(axes.map((a, i) => point(i, n, a.value ?? 0)))} fill="rgba(244,114,182,0.28)" stroke="#F472B6" strokeWidth={2} strokeLinejoin="round" />
      {axes.map((a, i) => {
        if (a.value === null) return null;
        const [x, y] = point(i, n, a.value);
        return <circle key={a.key} cx={x} cy={y} r={3.5} fill="#F9A8D4" />;
      })}

      {/* ラベル */}
      {axes.map((a, i) => {
        const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
        const x = C + LABEL_R * Math.cos(angle);
        const y = C + LABEL_R * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.2 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";
        return (
          <text key={a.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" fontSize={11.5} fontWeight={700} fill={a.value === null ? "#8F8AA8" : "#F5F1FF"}>
            {a.label}
            <tspan x={x} dy={14} fontSize={11} fontWeight={600} fill={a.value === null ? "#8F8AA8" : "#F9A8D4"}>{a.value === null ? "未測定" : a.value}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
