"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionData, SessionRecord, EvaluationResult } from "@/types";

/* ══════════════════════════════════════════════════════════════════════
   デザイントークン（v3）
══════════════════════════════════════════════════════════════════════ */
const V = {
  navy:    "#1C2B4A",
  navyLt:  "#EBF0FA",
  green:   "#4DB689",
  greenLt: "#EBF8F3",
  greenDk: "#2E8B63",
  coral:   "#F07268",
  coralLt: "#FEF3F2",
  amber:   "#F59E0B",
  amberLt: "#FFFBEB",
  blue:    "#3B82F6",
  blueLt:  "#EBF4FF",
  bg:      "#F4F7FA",
  surface: "#FFFFFF",
  ink:     "#1A2332",
  ink2:    "#4A5568",
  ink3:    "#8A9BAB",
  border:  "#E8ECF0",
  borderSoft: "#F0F4F8",
  sans:  '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  round: '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif',
} as const;

/* ══════════════════════════════════════════════════════════════════════
   型
══════════════════════════════════════════════════════════════════════ */
interface AxisData { key: string; label: string; short: string; ai: number; target: number; max: number; }
type TabId = "report" | "review";

const card: React.CSSProperties = {
  background: V.surface,
  border: `1px solid ${V.border}`,
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(26,35,50,0.05)",
};

/* ══════════════════════════════════════════════════════════════════════
   hooks
══════════════════════════════════════════════════════════════════════ */
function useCountUp(to: number, ms = 900) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return n;
}

function CountUpDisplay({ value }: { value: number }) {
  const n = useCountUp(value);
  return (
    <span style={{ fontFamily: V.round, fontSize: 58, fontWeight: 800, color: V.navy, lineHeight: 1 }}>
      {n}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   SVG コンポーネント
══════════════════════════════════════════════════════════════════════ */

/* 円形ゲージ */
function RadialGauge({ value }: { value: number }) {
  const size = 160, stroke = 14, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r, dash = c * (value / 100);
  const color = value >= 80 ? V.green : value >= 50 ? V.amber : V.coral;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <linearGradient id="ev-gauge3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={V.navy} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={V.bg} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ev-gauge3)"
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

/* 発話バランスドーナツ */
function DonutChart({ coachPct }: { coachPct: number }) {
  const r = 44, cx = 60, cy = 60, sw = 18;
  const c2 = 2 * Math.PI * r;
  const coach = c2 * (coachPct / 100);
  const client = c2 * ((100 - coachPct) / 100);
  return (
    <svg viewBox="0 0 120 120" width={120} height={120}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={V.green} strokeWidth={sw}
        strokeDasharray={`${client} ${coach}`}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={V.navy} strokeWidth={sw}
        strokeDasharray={`${coach} ${client}`}
        strokeDashoffset={-client}
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy-5} textAnchor="middle" fontFamily={V.round} fontSize={18} fontWeight={800} fill={V.navy}>{coachPct}%</text>
      <text x={cx} y={cy+13} textAnchor="middle" fontFamily={V.sans} fontSize={9} fill={V.ink3}>コーチ</text>
    </svg>
  );
}

/* デュアルポリゴンレーダー（AI評価 + Lv-Up目標） */
function RadarChart({ axes, size = 290 }: { axes: AxisData[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.35, n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number, max: number): [number, number] => {
    const a = angle(i), rad = (v / max) * r;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v, axes[i].max).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="AI評価レーダーチャート">
      {/* グリッド */}
      {[0.25, 0.5, 0.75, 1].map(g => (
        <polygon key={g}
          points={axes.map((_, i) => {
            const a = angle(i);
            return [cx + Math.cos(a) * r * g, cy + Math.sin(a) * r * g].join(",");
          }).join(" ")}
          fill={g === 1 ? "none" : "none"}
          stroke={V.border} strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={V.border} strokeWidth="1" />;
      })}

      {/* AI評価（塗りつぶし・ネイビー） */}
      <polygon
        points={poly(axes.map(a => a.ai))}
        fill={V.navy} fillOpacity="0.15"
        stroke={V.navy} strokeWidth="2.5" strokeLinejoin="round"
      />

      {/* Lv-Up目標（破線・コーラル） */}
      <polygon
        points={poly(axes.map(a => a.target))}
        fill="none"
        stroke={V.coral} strokeWidth="1.5"
        strokeDasharray="5 3" strokeLinejoin="round"
      />

      {/* ドット */}
      {axes.map((a, i) => {
        const [x, y] = pt(i, a.ai, a.max);
        return <circle key={i} cx={x} cy={y} r={4.5} fill={V.navy} stroke="#fff" strokeWidth="2" />;
      })}

      {/* ラベル */}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, 1.22, 1);
        const cos = Math.cos(angle(i));
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <g key={i} transform={`translate(${lx},${ly})`}>
            <text x="0" y="0" textAnchor={anchor} fontFamily={V.round} fontSize="12"
              fontWeight="700" fill={V.ink} dominantBaseline="middle">{a.label}</text>
            <text x="0" y="14" textAnchor={anchor} fontFamily={V.sans} fontSize="9"
              fill={V.ink3} dominantBaseline="middle">{a.ai}/{a.max}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* 成長トレンドチャート */
function GrowthChart({ data }: { data: number[] }) {
  const W = 640, H = 170, pL = 28, pR = 24, pT = 16, pB = 24;
  const iW = W - pL - pR, iH = H - pT - pB, n = data.length;
  const x = (i: number) => pL + (i / Math.max(n - 1, 1)) * iW;
  const y = (v: number) => pT + (1 - v / 100) * iH;
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${y(data[0] ?? 0)} ${pts} ${x(n - 1)},${H - pB}`;
  const diff = n >= 2 ? data[n - 1] - data[n - 2] : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ev-growth3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.navy} stopOpacity="0.15" />
          <stop offset="100%" stopColor={V.navy} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(g => (
        <g key={g}>
          <line x1={pL} y1={y(g)} x2={W - pR} y2={y(g)} stroke={V.borderSoft} strokeWidth="1" />
          <text x={pL - 5} y={y(g) + 3} textAnchor="end" fontSize="10" fontFamily={V.sans} fill={V.ink3}>{g}</text>
        </g>
      ))}
      {data.map((_, i) => (
        <text key={i} x={x(i)} y={H - 5} textAnchor="middle" fontFamily={V.sans} fontSize="10" fill={V.ink3}>{i + 1}</text>
      ))}
      <polygon points={area} fill="url(#ev-growth3)" />
      <polyline points={pts} fill="none" stroke={V.navy} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const last = i === n - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={last ? 6 : 3.5}
              fill={last ? V.coral : V.surface}
              stroke={last ? "#fff" : V.navy} strokeWidth={last ? 3 : 2} />
            {last && (
              <>
                <rect x={x(i) - 26} y={y(v) - 30} width="52" height="22" rx="6" fill={V.navy} />
                <text x={x(i)} y={y(v) - 15} textAnchor="middle" fontFamily={V.round} fontSize="12" fontWeight="700" fill="#fff">{v} 点</text>
              </>
            )}
          </g>
        );
      })}
      {n >= 2 && (
        <text x={W - pR} y={pT + 10} textAnchor="end" fontFamily={V.round} fontSize="11" fontWeight="700"
          fill={diff >= 0 ? V.green : V.coral}>
          {diff >= 0 ? `↑ +${diff} pt` : `↓ ${diff} pt`}
        </text>
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ローディング・エラー
══════════════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div className="screen-minh" style={{ background: V.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: `3px solid ${V.border}`, borderTopColor: V.navy,
          animation: "spin 1s linear infinite", margin: "0 auto 20px",
        }} />
        <p style={{ fontFamily: V.round, fontSize: 15, color: V.ink, fontWeight: 700 }}>セッションを分析中…</p>
        <p style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, marginTop: 6 }}>AIがコーチングを評価しています</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   データ変換
══════════════════════════════════════════════════════════════════════ */
function buildAxes(result: EvaluationResult): AxisData[] {
  const scoreMap: Record<string, number> = {};
  for (const s of result.scores) scoreMap[s.category] = Math.round((s.score / s.maxScore) * 20);
  const presence = Math.round(result.overallScore / 5);
  const mk = (key: string, label: string, short: string, ai: number): AxisData => ({
    key, label, short, ai, target: Math.min(ai + 3, 20), max: 20,
  });
  return [
    mk("listen",   "傾聴",     "Listen",   scoreMap["傾聴力"]         ?? 14),
    mk("empathy",  "共感",     "Empathy",  scoreMap["共感力"]         ?? 14),
    mk("question", "質問力",   "Inquiry",  scoreMap["質問力"]         ?? 13),
    mk("goal",     "目標設定", "Goal",     scoreMap["目標設定支援"]   ?? 12),
    mk("action",   "行動促進", "Action",   scoreMap["アクション促進"] ?? 12),
    mk("presence", "存在感",   "Presence", presence),
  ];
}

function durationStr(msgs: { role: string; content: string }[]) {
  const chars = msgs.reduce((s, m) => s + m.content.length, 0);
  const secs = Math.round(chars * 0.3);
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m} 分 ${s} 秒`;
}

function countStreak(history: SessionRecord[]) {
  let streak = 0;
  for (let i = 0; i < history.length - 1; i++) {
    if (history[i].evaluation.overallScore > history[i + 1].evaluation.overallScore) streak++;
    else break;
  }
  return streak;
}

/* ══════════════════════════════════════════════════════════════════════
   デモデータ
══════════════════════════════════════════════════════════════════════ */
const DEMO_SESSION: SessionData = {
  startedAt: "2026-05-25T10:00:00.000Z",
  endedAt:   "2026-05-25T10:28:00.000Z",
  scenario: {
    id: "s1", title: "部下のモチベーション向上", clientName: "田中 誠",
    clientRole: "チームリーダー（30代）", situation: "昇進後のチーム運営に悩む",
    emotion: "不安・焦り", description: "チームメンバーへの接し方",
    tags: ["マネジメント"], icon: "👥",
  },
  messages: [
    { role:"assistant", content:"こんにちは。今日はよろしくお願いします。" },
    { role:"user",      content:"最近チームの士気が低くて困っています。どうすればよいでしょうか。" },
    { role:"assistant", content:"それは大変ですね。具体的にどんな場面で感じますか？" },
    { role:"user",      content:"朝礼での反応が薄いんです。個別に話を聞くのが良いですか？" },
    { role:"assistant", content:"いい視点ですね。まずは一対一の場を作ってみましょう。" },
    { role:"user",      content:"具体的にどんな質問をすればいいですか？" },
    { role:"assistant", content:"「最近の仕事で充実感を感じたことはありますか？」から始めると自然です。" },
    { role:"user",      content:"なるほど、やってみます。ありがとうございます。" },
  ],
};
const DEMO_EVAL: EvaluationResult = {
  overallScore: 76,
  scores: [
    { category:"傾聴力",       score:7.5, maxScore:10, feedback:"相手の言葉をよく聞いていた" },
    { category:"共感力",       score:8.0, maxScore:10, feedback:"感情への配慮が見えた" },
    { category:"質問力",       score:7.0, maxScore:10, feedback:"オープンな質問が多かった" },
    { category:"目標設定支援", score:6.5, maxScore:10, feedback:"もう少し具体的に" },
    { category:"アクション促進",score:6.0, maxScore:10, feedback:"次のステップの明確化が必要" },
  ],
  strengths: ["積極的な傾聴姿勢が素晴らしい", "共感的な言葉かけができている", "オープンクエスチョンを効果的に使えている"],
  improvements: ["より深い質問で本質に迫る", "クライアントの感情をより丁寧に確認する", "具体的なアクションプランの設定をサポートする"],
  nextSteps: "次回の練習では、オープンクエスチョンに加えてリフレクションを意識的に使ってみましょう。また、クライアントが自分でアクションを決める支援をより強化してください。",
  summary: "全体的に良いコーチングができていました。傾聴と共感は高水準で安定しており、次のステップは質問の深掘りとアクションプランの明確化です。",
  previousImprovementsReview: [],
};

/* ══════════════════════════════════════════════════════════════════════
   メインページ
══════════════════════════════════════════════════════════════════════ */
export default function EvaluationPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("report");
  const [expandedGroup, setExpandedGroup] = useState<string | null>("good");

  const toggleGroup = useCallback((id: string) => setExpandedGroup(p => p === id ? null : id), []);

  useEffect(() => {
    const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";
    if (isDemo) {
      const demoHistory: SessionRecord[] = [
        { id:"2026-05-25T10:00:00.000Z", session:DEMO_SESSION, evaluation:DEMO_EVAL, savedAt:"2026-05-25T10:30:00.000Z" },
        { id:"2026-05-24T10:00:00.000Z", session:DEMO_SESSION, evaluation:{...DEMO_EVAL,overallScore:70}, savedAt:"2026-05-24T10:30:00.000Z" },
        { id:"2026-05-23T10:00:00.000Z", session:DEMO_SESSION, evaluation:{...DEMO_EVAL,overallScore:63}, savedAt:"2026-05-23T10:30:00.000Z" },
        { id:"2026-05-22T10:00:00.000Z", session:DEMO_SESSION, evaluation:{...DEMO_EVAL,overallScore:58}, savedAt:"2026-05-22T10:30:00.000Z" },
      ];
      setSession(DEMO_SESSION); setResult(DEMO_EVAL); setHistory(demoHistory); setIsLoading(false);
      return;
    }

    const stored = localStorage.getItem("coachingSession");
    if (!stored) { router.push("/session"); return; }
    const sessionData: SessionData = JSON.parse(stored);
    setSession(sessionData);

    const raw = localStorage.getItem("sessionHistory");
    const hist: SessionRecord[] = raw ? JSON.parse(raw) : [];
    setHistory(hist);

    const prevRecord = hist.find(r => r.id !== sessionData.startedAt) ?? null;
    const prevImprovements = prevRecord?.evaluation.improvements ?? [];

    const userMsgs = sessionData.messages.filter(m => m.role === "user");
    if (userMsgs.length < 2) {
      setError("セッションのメッセージが少なすぎます。もう少し会話してから評価してください。");
      setIsLoading(false);
      return;
    }

    fetch("/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: sessionData.messages, scenario: sessionData.scenario, previousImprovements: prevImprovements }),
    })
      .then(async res => {
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "評価の取得に失敗しました"); }
        return res.json() as Promise<EvaluationResult>;
      })
      .then(data => {
        setResult(data);
        try {
          const recordId = sessionData.startedAt;
          if (!hist.some(r => r.id === recordId)) {
            const newRecord: SessionRecord = { id: recordId, session: sessionData, evaluation: data, savedAt: new Date().toISOString() };
            const updated = [newRecord, ...hist].slice(0, 50);
            localStorage.setItem("sessionHistory", JSON.stringify(updated));
            setHistory(updated);
          }
        } catch { /* ignore */ }
        setIsLoading(false);
      })
      .catch((err: Error) => { setError(err.message); setIsLoading(false); });
  }, [router]);

  /* ── ローディング ── */
  if (isLoading) return <LoadingScreen />;

  /* ── エラー ── */
  if (error) {
    const isCredit = error.includes("クレジット") || error.includes("credit");
    return (
      <div className="screen-minh" style={{ background: V.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <div style={{ width: 60, height: 60, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
          </div>
          <h2 style={{ fontFamily: V.round, fontSize: 19, fontWeight: 700, color: V.ink, marginBottom: 10 }}>
            {isCredit ? "APIクレジットが不足しています" : "評価の取得に失敗しました"}
          </h2>
          <p style={{ fontFamily: V.sans, fontSize: 13, color: V.ink2, lineHeight: 1.8, marginBottom: 24 }}>
            {isCredit
              ? "Anthropic コンソールでクレジットを追加すると評価が利用できます。デモモードでレポート画面を確認できます。"
              : error}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {isCredit && (
              <Link href="/evaluation?demo=1" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 26px", background: V.navy, color: "#fff", borderRadius: 12, fontFamily: V.round, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: `0 8px 20px -8px ${V.navy}` }}>
                📊 デモモードで確認する
              </Link>
            )}
            <Link href="/session" style={{ display: "inline-block", padding: "11px 22px", color: V.ink2, border: `1px solid ${V.border}`, borderRadius: 10, fontFamily: V.round, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
              ← セッションに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!result || !session) return null;

  /* ── データ加工 ── */
  const axes = buildAxes(result);
  const score = result.overallScore;
  const allScores: number[] = history.map(r => r.evaluation.overallScore).reverse().slice(-10);
  if (allScores.length === 0) allScores.push(score);
  const streak = countStreak(history);
  const practiceNo = history.length || 1;
  const userMsgCount = session.messages.filter(m => m.role === "user").length;
  const totalMsgCount = session.messages.length;
  const coachPct = Math.round((userMsgCount / Math.max(totalMsgCount, 1)) * 100);
  const duration = durationStr(session.messages);
  const prevScore = history.length >= 2 ? history[1].evaluation.overallScore : null;
  const scoreDiff = prevScore !== null ? score - prevScore : null;
  const today = new Date(session.startedAt ?? Date.now());
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, r) => s + r.evaluation.overallScore, 0) / history.length) : score;
  const hasPrevReview = (result.previousImprovementsReview?.length ?? 0) > 0;

  /* ── ふりかえりグループ ── */
  const reviewGroups = [
    {
      id: "good",
      icon: "✅",
      label: "良かった点",
      count: result.strengths.length,
      color: V.green, colorLt: V.greenLt, colorDk: V.greenDk,
      items: result.strengths,
    },
    {
      id: "fix",
      icon: "📈",
      label: "改善できる点",
      count: result.improvements.length,
      color: V.coral, colorLt: V.coralLt, colorDk: "#C0453A",
      items: result.improvements,
    },
  ];

  const nextItems = result.nextSteps
    .split(/。\s*/)
    .filter(s => s.trim().length > 3)
    .slice(0, 3);

  /* ══════════════════════════════════════════════════════════════
     レンダリング
  ══════════════════════════════════════════════════════════════ */
  return (
    <div className="screen-minh" style={{ background: V.bg, fontFamily: V.sans }}>

      {/* ─── ページヘッダー ─── */}
      <div className="rs-px" style={{ background: V.surface, borderBottom: `1px solid ${V.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          {/* タイトル行 */}
          <div className="rs-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 0" }}>
            <div>
              <div style={{ fontSize: 11, color: V.ink3, marginBottom: 5 }}>
                練習 #{practiceNo} ・ {dateStr} ・ {session.scenario.clientName}さん
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: V.navy, margin: 0, letterSpacing: "-0.02em" }}>
                {session.scenario.title}
              </h1>
            </div>
            <div className="rs-wrap" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {streak > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: V.amberLt, color: V.amber, padding: "6px 12px", borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                  🔥 {streak} 回連続上昇中
                </div>
              )}
              <Link href="/session" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: V.navy, color: "white", borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: "none", boxShadow: `0 6px 16px -6px ${V.navy}` }}>
                ▶ もう一度練習する
              </Link>
            </div>
          </div>

          {/* タブ */}
          <div style={{ display: "flex", gap: 2, paddingTop: 16, borderBottom: "none" }}>
            {([
              { id: "report" as TabId, label: "📊 評価レポート" },
              { id: "review" as TabId, label: "💬 ふりかえり" },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "10px 10px 0 0",
                  border: "none",
                  borderBottom: activeTab === tab.id ? `3px solid ${V.navy}` : "3px solid transparent",
                  background: activeTab === tab.id ? V.navyLt : "transparent",
                  color: activeTab === tab.id ? V.navy : V.ink3,
                  fontWeight: activeTab === tab.id ? 700 : 400,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: V.round,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── タブコンテンツ ─── */}
      <div className="rs-px" style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 32px 40px" }}>

        {/* ════════════════════════════════════
            TAB 1: 評価レポート
        ════════════════════════════════════ */}
        {activeTab === "report" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Row 1: スコアカード + レーダー */}
            <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>

              {/* スコアカード */}
              <div style={{ ...card, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: V.ink3, letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
                  総合スコア
                </div>
                <div style={{ position: "relative", width: 160, height: 160, marginBottom: 10 }}>
                  <RadialGauge value={score} />
                  <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                    <div>
                      <CountUpDisplay value={score} />
                      <div style={{ fontSize: 11, color: V.ink3, fontWeight: 600 }}>/ 100</div>
                    </div>
                  </div>
                </div>

                {scoreDiff !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: scoreDiff >= 0 ? V.greenLt : V.coralLt, padding: "7px 14px", borderRadius: 100, marginBottom: 14 }}>
                    <span style={{ fontSize: 14 }}>{scoreDiff >= 0 ? "↑" : "↓"}</span>
                    <span style={{ color: scoreDiff >= 0 ? V.greenDk : V.coral, fontSize: 13, fontWeight: 700 }}>
                      前回比 {scoreDiff >= 0 ? "+" : ""}{scoreDiff} 点
                    </span>
                  </div>
                )}

                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["対話時間", duration],
                    ["発話数", `コーチ ${userMsgCount} / クライアント ${totalMsgCount - userMsgCount}`],
                    ["平均スコア", `${avgScore} 点 (${history.length}回)`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 7, borderBottom: `1px dashed ${V.borderSoft}` }}>
                      <span style={{ color: V.ink3 }}>{k}</span>
                      <span style={{ color: V.ink, fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* レーダー + 軸ブレークダウン */}
              <div style={{ ...card, padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.navy }}>360° パフォーマンス</div>
                    <div style={{ fontSize: 12, color: V.ink3, marginTop: 3 }}>6 軸で AI がコーチングスキルを評価</div>
                  </div>
                  <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: V.navy }} />
                      <span style={{ fontSize: 11, color: V.ink2 }}>AI 評価</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke={V.coral} strokeWidth="1.5" strokeDasharray="4 2" /></svg>
                      <span style={{ fontSize: 11, color: V.ink2 }}>Lv-Up 目標</span>
                    </div>
                  </div>
                </div>
                <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 24, alignItems: "center" }}>
                  <RadarChart axes={axes} size={270} />
                  {/* 軸テーブル */}
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 40px 36px", gap: "6px 10px", alignItems: "center", marginBottom: 10, fontSize: 10, color: V.ink3, fontWeight: 600, textTransform: "uppercase" }}>
                      <span>スキル</span><span>バー</span><span style={{ textAlign: "right" }}>スコア</span><span style={{ textAlign: "right" }}>GAP</span>
                    </div>
                    {axes.map(a => {
                      const gap = a.target - a.ai;
                      return (
                        <div key={a.key} style={{ display: "grid", gridTemplateColumns: "80px 1fr 40px 36px", gap: "6px 10px", alignItems: "center", padding: "6px 0", borderBottom: `1px dashed ${V.borderSoft}` }}>
                          <div>
                            <div style={{ fontFamily: V.round, fontSize: 12, fontWeight: 700, color: V.ink }}>{a.label}</div>
                            <div style={{ fontSize: 9, color: V.ink3 }}>{a.short}</div>
                          </div>
                          <div style={{ height: 5, background: V.bg, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${(a.ai / a.max) * 100}%`, height: "100%", background: V.navy, borderRadius: 3 }} />
                          </div>
                          <div style={{ textAlign: "right", fontFamily: V.round, fontSize: 13, fontWeight: 700, color: V.navy }}>
                            {a.ai}<span style={{ fontSize: 9, color: V.ink3 }}>/20</span>
                          </div>
                          <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: gap > 0 ? V.coral : V.green }}>
                            {gap > 0 ? `+${gap}` : "✓"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: 3 カード */}
            <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {/* 強み */}
              <div style={{ ...card, padding: "20px", borderTop: `3px solid ${V.green}` }}>
                <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 14, color: V.greenDk, marginBottom: 12 }}>✅ 強み</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: V.ink2, lineHeight: 1.5 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: V.greenLt, color: V.greenDk, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i+1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* 伸びしろ */}
              <div style={{ ...card, padding: "20px", borderTop: `3px solid ${V.coral}` }}>
                <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 14, color: "#C0453A", marginBottom: 12 }}>📈 伸びしろ</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {result.improvements.map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: V.ink2, lineHeight: 1.5 }}>
                      <span style={{ width: 18, height: 18, borderRadius: "50%", background: V.coralLt, color: "#C0453A", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i+1}</span>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              {/* 前回からの変化 */}
              <div style={{ ...card, padding: "20px", borderTop: `3px solid ${V.navy}` }}>
                <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 14, color: V.navy, marginBottom: 12 }}>📊 前回からの変化</div>
                {hasPrevReview ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {result.previousImprovementsReview!.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: V.ink2, lineHeight: 1.5 }}>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", background: r.addressed ? V.greenLt : V.coralLt, color: r.addressed ? V.greenDk : V.coral, display: "grid", placeItems: "center", fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                          {r.addressed ? "✓" : "−"}
                        </span>
                        {r.item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {scoreDiff !== null ? (
                      <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: scoreDiff >= 0 ? V.green : V.coral, lineHeight: 1 }}>
                          {scoreDiff >= 0 ? "+" : ""}{scoreDiff}
                        </div>
                        <div style={{ fontSize: 12, color: V.ink3, marginTop: 4 }}>点（前回比）</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: V.ink3, lineHeight: 1.7 }}>
                        次回のセッション後、<br />前回との比較が表示されます。
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: 成長トレンド + 発話バランス + スキル別 */}
            <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 200px 240px", gap: 16 }}>
              {/* 成長トレンド */}
              <div style={{ ...card, padding: "22px 24px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: V.round, fontSize: 15, fontWeight: 700, color: V.navy }}>スコア推移</div>
                    <div style={{ fontSize: 12, color: V.ink3, marginTop: 3 }}>過去 {allScores.length} 回のセッション</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: V.ink }}>
                    平均: <span style={{ color: V.navy }}>{avgScore} 点</span>
                  </div>
                </div>
                <GrowthChart data={allScores} />
              </div>

              {/* 発話バランス */}
              <div style={{ ...card, padding: "22px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ fontFamily: V.round, fontSize: 14, fontWeight: 700, color: V.navy, marginBottom: 12 }}>発話バランス</div>
                <DonutChart coachPct={coachPct} />
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: V.navy }} />
                      <span style={{ color: V.ink2 }}>コーチ</span>
                    </div>
                    <span style={{ fontWeight: 700, color: V.navy }}>{coachPct}%</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: V.green }} />
                      <span style={{ color: V.ink2 }}>クライアント</span>
                    </div>
                    <span style={{ fontWeight: 700, color: V.green }}>{100 - coachPct}%</span>
                  </div>
                </div>
              </div>

              {/* スキル別バー */}
              <div style={{ ...card, padding: "22px 20px" }}>
                <div style={{ fontFamily: V.round, fontSize: 14, fontWeight: 700, color: V.navy, marginBottom: 16 }}>スキル別</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {result.scores.map(s => {
                    const pct = (s.score / s.maxScore) * 100;
                    const barColor = pct >= 80 ? V.green : pct >= 60 ? V.navy : V.coral;
                    return (
                      <div key={s.category}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: V.ink2, fontWeight: 600 }}>{s.category}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: barColor }}>{s.score}/{s.maxScore}</span>
                        </div>
                        <div style={{ height: 5, background: V.bg, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AIからのひとこと */}
            <div style={{
              background: `linear-gradient(135deg, ${V.navy} 0%, #2D4070 100%)`,
              borderRadius: 16,
              padding: "22px 28px",
              display: "flex",
              alignItems: "flex-start",
              gap: 18,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, flexShrink: 0,
              }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: V.round, fontSize: 12, fontWeight: 700, color: V.green, letterSpacing: "0.06em", marginBottom: 8 }}>
                  AI からのひとこと
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 1.8 }}>
                  {result.nextSteps}
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => alert("ダウンロード機能は準備中です")}
                style={{
                  padding: "12px 22px",
                  borderRadius: 12,
                  border: `1px solid ${V.border}`,
                  background: V.surface,
                  color: V.ink2,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: V.sans,
                }}
              >
                ⬇ レポートをダウンロード
              </button>
              <button
                onClick={() => setActiveTab("review")}
                style={{
                  padding: "12px 26px",
                  borderRadius: 12,
                  border: "none",
                  background: V.navy,
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: `0 8px 20px -8px ${V.navy}`,
                  fontFamily: V.sans,
                }}
              >
                💬 ふりかえりを見る
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            TAB 2: ふりかえり
        ════════════════════════════════════ */}
        {activeTab === "review" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ─ 3 stat pills ─ */}
            <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.4fr", gap: 14 }}>
              <div style={{ ...card, padding: "18px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: V.round, fontSize: 34, fontWeight: 800, color: V.navy, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6, fontWeight: 600 }}>スコア</div>
              </div>
              <div style={{ ...card, padding: "18px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: V.round, fontSize: 34, fontWeight: 800, lineHeight: 1, color: scoreDiff !== null && scoreDiff >= 0 ? V.green : V.coral }}>
                  {scoreDiff !== null ? `${scoreDiff >= 0 ? "+" : ""}${scoreDiff}` : "—"}
                </div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6, fontWeight: 600 }}>前回比</div>
              </div>
              <div style={{ ...card, padding: "18px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontFamily: V.round, fontSize: 15, fontWeight: 800, color: V.navy, lineHeight: 1.2, marginBottom: 6 }}>
                  {session.scenario.tags?.[0] ?? "マネジメント"}
                </div>
                <div style={{ fontSize: 11, color: V.ink3, fontWeight: 600 }}>注目テーマ</div>
              </div>
            </div>

            {/* ─ 2-column: 所見 | 次の練習 ─ */}
            <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* 左: 所見 + アコーディオン */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ ...card, padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 34, height: 34, background: V.navyLt, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>📝</div>
                    <div style={{ fontFamily: V.round, fontSize: 15, fontWeight: 700, color: V.navy }}>所見</div>
                  </div>
                  <p style={{ fontSize: 13, color: V.ink2, lineHeight: 1.8, marginBottom: 14 }}>{result.summary}</p>

                  {reviewGroups.map(group => {
                    const open = expandedGroup === group.id;
                    return (
                      <div key={group.id} style={{ marginBottom: 8, borderRadius: 12, background: group.colorLt, border: `1px solid ${open ? group.color : "transparent"}`, overflow: "hidden", transition: "border-color 0.15s" }}>
                        <button
                          onClick={() => toggleGroup(group.id)}
                          style={{ width: "100%", border: "none", background: "transparent", padding: "12px 16px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                        >
                          <span style={{ width: 26, height: 26, borderRadius: 7, background: "#fff", display: "grid", placeItems: "center", fontSize: 14, flexShrink: 0 }}>{group.icon}</span>
                          <span style={{ fontFamily: V.round, fontWeight: 700, fontSize: 13, color: group.colorDk, flex: 1 }}>
                            {group.label} <span style={{ fontSize: 11, color: group.color }}>{group.count} 件</span>
                          </span>
                          <span style={{ fontWeight: 700, color: group.colorDk, display: "inline-block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", fontSize: 15 }}>⌄</span>
                        </button>
                        {open && (
                          <div>
                            {group.items.map((item, i) => (
                              <div key={i} style={{ display: "flex", gap: 10, padding: "9px 16px", borderTop: `1px dashed ${V.border}` }}>
                                <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", color: group.colorDk, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                                <div style={{ fontSize: 12, color: V.ink, lineHeight: 1.6 }}>{item}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 右: 次の練習 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ ...card, padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 34, height: 34, background: V.navyLt, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🎯</div>
                    <div style={{ fontFamily: V.round, fontSize: 15, fontWeight: 700, color: V.navy }}>次の練習で意識すること</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {nextItems.map((item, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: V.navy, color: "white", display: "grid", placeItems: "center", fontFamily: V.round, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <div style={{ fontSize: 13, color: V.ink, lineHeight: 1.7, paddingTop: 5 }}>{item}。</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI からのフィードバック */}
                <div style={{ ...card, padding: "22px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 34, height: 34, background: "#F0F4FF", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🤖</div>
                    <div style={{ fontFamily: V.round, fontSize: 15, fontWeight: 700, color: V.navy }}>AI からのフィードバック</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.scores.map((s) => {
                      const pct = (s.score / s.maxScore) * 100;
                      const color = pct >= 80 ? V.green : pct >= 60 ? V.amber : V.coral;
                      return (
                        <div key={s.category} style={{ background: V.bg, borderRadius: 10, padding: "12px 14px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: V.navy }}>{s.category}</div>
                            <div style={{ fontFamily: V.round, fontSize: 13, fontWeight: 800, color }}>{s.score.toFixed(1)}<span style={{ fontSize: 9, color: V.ink3, fontWeight: 400 }}>/{s.maxScore}</span></div>
                          </div>
                          <div style={{ height: 3, background: V.border, borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 11, color: V.ink2, lineHeight: 1.6 }}>{s.feedback}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ─ 印象に残ったやり取り ─ */}
            <div style={{ ...card, padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 34, height: 34, background: V.amberLt, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>💬</div>
                <div style={{ fontFamily: V.round, fontSize: 15, fontWeight: 700, color: V.navy }}>印象に残ったやり取り</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {session.messages.filter(m => m.content.length > 15).slice(0, 4).map((m, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    flexDirection: m.role === "user" ? "row" : "row-reverse",
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: m.role === "user" ? V.navy : V.greenLt,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, flexShrink: 0, color: m.role === "user" ? "white" : V.greenDk,
                      fontWeight: 700,
                    }}>
                      {m.role === "user" ? "C" : "A"}
                    </div>
                    <div style={{
                      background: m.role === "user" ? V.navyLt : V.greenLt,
                      borderRadius: 12,
                      padding: "10px 14px",
                      fontSize: 12,
                      color: V.ink,
                      lineHeight: 1.6,
                      maxWidth: "75%",
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* アクションボタン */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Link href="/history" style={{ padding: "12px 22px", border: `1px solid ${V.border}`, borderRadius: 12, color: V.ink2, fontSize: 14, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                ← 練習履歴
              </Link>
              <Link href="/session" style={{ padding: "12px 26px", background: V.navy, color: "white", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: `0 8px 20px -8px ${V.navy}` }}>
                次の練習を始める ▶
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
