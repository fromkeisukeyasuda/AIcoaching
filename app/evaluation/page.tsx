"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionData, SessionRecord, EvaluationResult } from "@/types";

/* ══════════════════════════════════════════════════════════════════════
   デザイントークン（v2-shell と同一）
══════════════════════════════════════════════════════════════════════ */
const V = {
  blue:       "#4A90E2",
  blueDeep:   "#2D6CB8",
  blueLite:   "#E3F2FD",
  coral:      "#FF6B6B",
  coralLite:  "#FFE3E3",
  green:      "#6BCB77",
  greenLite:  "#E8F5E9",
  greenDark:  "#2D7A36",
  orange:     "#FFB347",
  bg:         "#F8F9FA",
  surface:    "#FFFFFF",
  ink:        "#2D3436",
  ink2:       "#5B6066",
  ink3:       "#9AA0A6",
  border:     "#E5E7EB",
  borderSoft: "#EEF1F4",
  round: '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif',
  sans:  '"Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
} as const;

/* ══════════════════════════════════════════════════════════════════════
   ユーティリティ型・定数
══════════════════════════════════════════════════════════════════════ */
interface AxisData { key: string; label: string; short: string; ai: number; max: number; }
type GroupId = "good" | "fix" | "next";

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

/* ══════════════════════════════════════════════════════════════════════
   SVG コンポーネント群
══════════════════════════════════════════════════════════════════════ */

/* 円形ゲージ */
function RadialGauge({ value }: { value: number }) {
  const size = 168, stroke = 14, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r, dash = c * (value / 100);
  const color = value >= 80 ? V.green : value >= 50 ? V.orange : V.coral;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <linearGradient id="ev-gauge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={V.blue} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={V.bg} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#ev-gauge)"
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
    </svg>
  );
}

/* レーダーチャート（AI 評価のみ） */
function RadarChart({ axes, size = 300 }: { axes: AxisData[]; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36, n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number, max: number): [number, number] => {
    const a = angle(i), rad = (v / max) * r;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const poly = (vals: number[]) => vals.map((v, i) => pt(i, v, axes[i].max).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}
      role="img" aria-label="6軸のAI評価レーダーチャート">
      {[0.25, 0.5, 0.75, 1].map(g => (
        <polygon key={g}
          points={axes.map((_, i) => {
            const a = angle(i);
            return [cx + Math.cos(a) * r * g, cy + Math.sin(a) * r * g].join(",");
          }).join(" ")}
          fill="none" stroke={V.border} strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={V.border} strokeWidth="1" />;
      })}
      <polygon points={poly(axes.map(a => a.ai))}
        fill={V.blue} fillOpacity="0.22" stroke={V.blue} strokeWidth="2" strokeLinejoin="round" />
      {axes.map((a, i) => {
        const [x, y] = pt(i, a.ai, a.max);
        return <circle key={i} cx={x} cy={y} r={4} fill={V.blue} stroke="#fff" strokeWidth="1.5" />;
      })}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, 1.18, 1);
        const cos = Math.cos(angle(i));
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        return (
          <g key={i} transform={`translate(${lx},${ly})`}>
            <text x="0" y="0" textAnchor={anchor} fontFamily={V.round} fontSize="12"
              fontWeight="700" fill={V.ink} dominantBaseline="middle">{a.label}</text>
            <text x="0" y="14" textAnchor={anchor} fontFamily={V.sans} fontSize="9"
              fill={V.ink3} dominantBaseline="middle">{a.ai}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* 成長トレンドチャート */
function GrowthChart({ data }: { data: number[] }) {
  const W = 560, H = 180, pL = 28, pR = 24, pT = 18, pB = 26;
  const iW = W - pL - pR, iH = H - pT - pB, n = data.length;
  const x = (i: number) => pL + (i / Math.max(n - 1, 1)) * iW;
  const y = (v: number) => pT + (1 - v / 100) * iH;
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `${x(0)},${y(0)} ${pts} ${x(n - 1)},${y(0)}`;
  const diff = n >= 2 ? data[n - 1] - data[n - 2] : 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W, display: "block" }}>
      <defs>
        <linearGradient id="ev-growth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.blue} stopOpacity="0.18" />
          <stop offset="100%" stopColor={V.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(g => (
        <g key={g}>
          <line x1={pL} y1={y(g)} x2={W - pR} y2={y(g)} stroke={V.borderSoft} strokeWidth="1" />
          <text x={pL - 6} y={y(g) + 3} textAnchor="end" fontSize="10"
            fontFamily={V.sans} fill={V.ink3}>{g}</text>
        </g>
      ))}
      {data.map((_, i) => (
        <text key={i} x={x(i)} y={H - 6} textAnchor="middle"
          fontFamily={V.sans} fontSize="10" fill={V.ink3}>{i + 1}</text>
      ))}
      <polygon points={area} fill="url(#ev-growth)" />
      <polyline points={pts} fill="none" stroke={V.blue} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        const last = i === n - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={last ? 6 : 3.5}
              fill={last ? V.coral : V.surface}
              stroke={last ? "#fff" : V.blue} strokeWidth={last ? 3 : 2} />
            {last && (
              <>
                <rect x={x(i) - 26} y={y(v) - 32} width="52" height="22" rx="6" fill={V.ink} />
                <text x={x(i)} y={y(v) - 17} textAnchor="middle"
                  fontFamily={V.round} fontSize="12" fontWeight="700" fill="#fff">{v} 点</text>
              </>
            )}
          </g>
        );
      })}
      {n >= 2 && (
        <g transform={`translate(${W - pR - 12},${pT + 2})`}>
          <text textAnchor="end" fontFamily={V.round} fontSize="10" fontWeight="700"
            fill={diff >= 0 ? V.green : V.coral}>
            {diff >= 0 ? `↑ 前回比 +${diff}` : `↓ 前回比 ${diff}`}
          </text>
        </g>
      )}
    </svg>
  );
}

/* サイドバー内スパークライン */
function SidebarSparkline({ scores }: { scores: number[] }) {
  const n = Math.min(scores.length, 8);
  const slice = scores.slice(-n);
  if (slice.length < 2) return (
    <svg viewBox="0 0 120 36" width="100%" height="36" style={{ display: "block" }}>
      <path d="M0 28 L120 18" fill="none" stroke={V.blue} strokeWidth="1.5" />
    </svg>
  );
  const pts = slice.map((v, i) => {
    const px = (i / (n - 1)) * 120;
    const py = 32 - (v / 100) * 28;
    return `${px} ${py}`;
  }).join(" L");
  const last = slice[slice.length - 1];
  const lx = 120, ly = 32 - (last / 100) * 28;

  return (
    <svg viewBox="0 0 120 36" width="100%" height="36" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ev-spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.blue} stopOpacity="0.25" />
          <stop offset="100%" stopColor={V.blue} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts.replace(/ L/g, " L")} L${lx} 36 L0 36 Z`}
        fill="url(#ev-spark)" />
      <path d={`M${pts}`} fill="none" stroke={V.blue} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="2.5" fill={V.coral} />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ローディング・エラー画面
══════════════════════════════════════════════════════════════════════ */
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: V.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: `3px solid ${V.border}`, borderTopColor: V.blue,
          animation: "spin 1s linear infinite", margin: "0 auto 20px",
        }} />
        <p style={{ fontFamily: V.round, fontSize: 15, color: V.ink, fontWeight: 600 }}>セッションを分析中…</p>
        <p style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, marginTop: 6 }}>AIがコーチングを評価しています</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   データ変換ヘルパー
══════════════════════════════════════════════════════════════════════ */
function buildAxes(result: EvaluationResult): AxisData[] {
  const scoreMap: Record<string, number> = {};
  for (const s of result.scores) {
    scoreMap[s.category] = Math.round((s.score / s.maxScore) * 20);
  }
  const presence = Math.round(result.overallScore / 5);
  return [
    { key: "listen",   label: "傾聴",     short: "Listen",   ai: scoreMap["傾聴力"]       ?? 15, max: 20 },
    { key: "empathy",  label: "共感",     short: "Empathy",  ai: scoreMap["共感力"]       ?? 15, max: 20 },
    { key: "question", label: "質問力",   short: "Inquiry",  ai: scoreMap["質問力"]       ?? 14, max: 20 },
    { key: "words",    label: "言語整理", short: "Clarity",  ai: scoreMap["目標設定支援"] ?? 14, max: 20 },
    { key: "assert",   label: "主張力",   short: "Assert",   ai: scoreMap["アクション促進"] ?? 13, max: 20 },
    { key: "presence", label: "Presence", short: "Presence", ai: presence,                        max: 20 },
  ];
}

function gapColor(gap: number) {
  if (Math.abs(gap) >= 3) return V.coral;
  if (Math.abs(gap) >= 2) return V.orange;
  return V.green;
}

function buildStrongestAxes(axes: AxisData[], n: number) {
  return [...axes].sort((a, b) => b.ai - a.ai).slice(0, n);
}
function buildWeakestAxes(axes: AxisData[], n: number) {
  return [...axes].sort((a, b) => a.ai - b.ai).slice(0, n);
}

function durationFromMessages(msgs: { role: string; content: string }[]) {
  const words = msgs.reduce((s, m) => s + m.content.length, 0);
  const secs = Math.round(words * 0.3);
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m} 分 ${s} 秒`;
}

function countStreak(history: SessionRecord[]): number {
  let streak = 0;
  for (let i = 0; i < history.length - 1; i++) {
    if (history[i].evaluation.overallScore > history[i + 1].evaluation.overallScore) {
      streak++;
    } else { break; }
  }
  return streak;
}

function practiceFreq(history: SessionRecord[]): string {
  if (history.length < 2) return "初回";
  const newest = new Date(history[0].savedAt);
  const oldest = new Date(history[history.length - 1].savedAt);
  const weeks = Math.max(1, (newest.getTime() - oldest.getTime()) / (7 * 24 * 3600 * 1000));
  return `週 ${(history.length / weeks).toFixed(1)} 回`;
}

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
  const [expanded, setExpanded] = useState<GroupId | null>("next");
  const [trendPeriod, setTrendPeriod] = useState(0); // 0=10回, 1=30回, 2=全期間

  const toggle = useCallback((id: GroupId) => {
    setExpanded(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    // ?demo=1 → API クレジット不要のデモモード
    const isDemo = new URLSearchParams(window.location.search).get("demo") === "1";
    if (isDemo) {
      const demoSession: SessionData = {
        startedAt: "2026-05-25T10:00:00.000Z",
        endedAt:   "2026-05-25T10:28:00.000Z",
        scenario: { id:"s1", title:"部下のモチベーション向上", clientName:"田中 誠", clientRole:"チームリーダー（30代）", situation:"昇進後のチーム運営に悩む", emotion:"不安・焦り", description:"チームメンバーへの接し方", tags:["マネジメント"], icon:"👥" },
        messages: [
          { role:"assistant", content:"こんにちは、今日はよろしくお願いします。" },
          { role:"user", content:"最近チームの士気が低くて困っています。どうすればよいでしょうか。" },
          { role:"assistant", content:"そうですか、それは大変ですね。具体的にどんな場面で感じますか？" },
          { role:"user", content:"朝礼での反応が薄いんです。個別に話を聞くのが良いですか？" },
          { role:"assistant", content:"いい視点ですね。まずは一対一の場を作ってみましょう。" },
          { role:"user", content:"具体的にどんな質問をすればいいですか？" },
        ],
      };
      const demoEval: EvaluationResult = {
        overallScore: 76,
        scores: [
          { category:"傾聴力", score:7.5, maxScore:10, feedback:"相手の言葉をよく聞いていた" },
          { category:"共感力", score:8.0, maxScore:10, feedback:"感情への配慮が見えた" },
          { category:"質問力", score:7.0, maxScore:10, feedback:"オープンな質問が多かった" },
          { category:"目標設定支援", score:6.5, maxScore:10, feedback:"もう少し具体的に" },
          { category:"アクション促進", score:6.0, maxScore:10, feedback:"次のステップの明確化が必要" },
        ],
        strengths: ["積極的な傾聴姿勢が素晴らしい","共感的な言葉かけができている","オープンクエスチョンを効果的に使えている"],
        improvements: ["より深い質問で本質に迫る","クライアントの感情をより丁寧に確認する","具体的なアクションプランの設定をサポートする"],
        nextSteps: "次回の練習では、オープンクエスチョンに加えてリフレクションを意識的に使ってみましょう。また、クライアントが自分でアクションを決める支援をより強化してください。",
        summary: "全体的に良いコーチングができていました。",
        previousImprovementsReview: [],
      };
      const demoHist: SessionRecord[] = [
        { id:"2026-05-25T10:00:00.000Z", session:demoSession, evaluation:demoEval, savedAt:"2026-05-25T10:30:00.000Z" },
        { id:"2026-05-24T10:00:00.000Z", session:demoSession, evaluation:{...demoEval,overallScore:70}, savedAt:"2026-05-24T10:30:00.000Z" },
        { id:"2026-05-23T10:00:00.000Z", session:demoSession, evaluation:{...demoEval,overallScore:63}, savedAt:"2026-05-23T10:30:00.000Z" },
        { id:"2026-05-22T10:00:00.000Z", session:demoSession, evaluation:{...demoEval,overallScore:58}, savedAt:"2026-05-22T10:30:00.000Z" },
      ];
      setSession(demoSession); setResult(demoEval); setHistory(demoHist); setIsLoading(false);
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

  if (isLoading) return <LoadingScreen />;

  if (error) {
    const isCredit = error.includes("クレジット") || error.includes("credit");
    return (
      <div style={{ minHeight: "100vh", background: V.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ width: 56, height: 56, background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 20px" }}>
            <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#EF4444">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: V.round, fontSize: 18, fontWeight: 700, color: V.ink, marginBottom: 10 }}>
            {isCredit ? "APIクレジットが不足しています" : "評価の取得に失敗しました"}
          </h2>
          <p style={{ fontFamily: V.sans, fontSize: 13, color: V.ink2, lineHeight: 1.8, marginBottom: 24 }}>
            {isCredit
              ? <>Anthropic コンソールでクレジットを追加すると評価が利用できます。<br />デモモードでレポート画面のデザインを確認できます。</>
              : error}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {isCredit && (
              <Link href="/evaluation?demo=1" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: V.blue, color: "#fff", borderRadius: 12, fontFamily: V.round, fontWeight: 700, fontSize: 14, textDecoration: "none", boxShadow: `0 8px 20px -8px ${V.blue}` }}>
                📊 デモモードで確認する
              </Link>
            )}
            <Link href="/session" style={{ display: "inline-block", padding: "10px 20px", background: "transparent", color: V.ink2, border: `1px solid ${V.border}`, borderRadius: 10, fontFamily: V.round, fontWeight: 600, fontSize: 13, textDecoration: "none" }}>
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
  const strongest = buildStrongestAxes(axes, 3);
  const weakest   = buildWeakestAxes(axes, 2);
  const allScores: number[] = history.map(r => r.evaluation.overallScore).reverse().slice(-10);
  if (allScores.length === 0) allScores.push(score);
  const streak = countStreak(history);
  const practiceNo = history.length;
  const freq = practiceFreq(history);
  const avgScore = history.length > 0
    ? Math.round(history.reduce((s, r) => s + r.evaluation.overallScore, 0) / history.length) : score;
  const userMsgs  = session.messages.filter(m => m.role === "user").length;
  const totalMsgs = session.messages.length;
  const duration  = durationFromMessages(session.messages);
  const today = new Date(session.startedAt ?? Date.now());
  const dateStr = `${today.getFullYear()}.${String(today.getMonth()+1).padStart(2,"0")}.${String(today.getDate()).padStart(2,"0")}`;
  const weekdays = ["日","月","火","水","木","金","土"];
  const hasPrevReview = (result.previousImprovementsReview?.length ?? 0) > 0;

  /* フィードバックグループ */
  const groups = [
    {
      id: "good" as GroupId,
      icon: "✅", color: V.green, bg: V.greenLite, dark: V.greenDark,
      title: "良かった点", count: result.strengths.length,
      items: result.strengths.map((t, i) => ({ title: t, detail: "" })),
    },
    {
      id: "fix" as GroupId,
      icon: "📈", color: V.coral, bg: V.coralLite, dark: "#B3433F",
      title: "改善できる点", count: result.improvements.length,
      items: result.improvements.map((t) => ({ title: t, detail: "" })),
    },
    {
      id: "next" as GroupId,
      icon: "🎯", color: V.blue, bg: V.blueLite, dark: V.blueDeep,
      title: "次の練習で意識すること", count: 3,
      items: result.nextSteps
        .split(/。|。\s+/)
        .filter(s => s.trim().length > 2)
        .slice(0, 3)
        .map(t => ({ title: t.trim() + (t.trim().endsWith("。") ? "" : ""), detail: "" })),
    },
  ];

  /* ── スタイル定数 ── */
  const card: React.CSSProperties = {
    background: V.surface, border: `1px solid ${V.border}`,
    borderRadius: 16, boxShadow: "0 1px 2px rgba(45,52,54,0.04)",
  };

  /* ══════════════════════════════════════════════════════════════════
     レンダリング
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gridTemplateRows: "64px 1fr", gridTemplateAreas: '"sidebar header" "sidebar main"', height: "100vh", background: V.bg, fontFamily: V.sans }}>

      {/* ── Sidebar ── */}
      <aside style={{ gridArea: "sidebar", background: V.surface, borderRight: `1px solid ${V.border}`, display: "flex", flexDirection: "column", padding: "20px 14px 18px", overflow: "hidden" }}>
        <div style={{ fontFamily: V.sans, fontSize: 10, fontWeight: 600, color: V.ink3, letterSpacing: "0.18em", textTransform: "uppercase", padding: "4px 10px 10px" }}>MENU</div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { id: "chat",    icon: "💬", label: "練習する",   sub: "AIと対話",          href: "/session" },
            { id: "history", icon: "📜", label: "会話履歴",   sub: `${history.length} セッション`, href: "/history" },
            { id: "report",  icon: "📊", label: "レポート",   sub: streak > 0 ? `前回 +${score - (history[1]?.evaluation.overallScore ?? score)} 点` : "最新の評価", href: "/evaluation" },
            { id: "home",    icon: "🏠", label: "ホーム",     sub: "",                  href: "/" },
          ].map(item => {
            const active = item.id === "report";
            return (
              <Link key={item.id} href={item.href} style={{ display: "flex", alignItems: "center", gap: 12, background: active ? V.blueLite : "transparent", borderRadius: 12, padding: "12px 12px", textDecoration: "none", position: "relative" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: active ? V.blue : V.bg, color: active ? "#fff" : V.ink2, display: "grid", placeItems: "center", fontSize: 15, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 13.5, color: active ? V.blue : V.ink, lineHeight: 1.2 }}>{item.label}</div>
                  {item.sub && <div style={{ fontFamily: V.sans, fontSize: 10.5, color: V.ink3, marginTop: 2 }}>{item.sub}</div>}
                </div>
                {active && <span style={{ position: "absolute", left: 0, top: 12, bottom: 12, width: 3, background: V.blue, borderRadius: "0 3px 3px 0" }} />}
              </Link>
            );
          })}
        </nav>

        {/* 今週の成長 */}
        <div style={{ marginTop: 22, padding: 14, background: V.bg, borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 12, color: V.ink }}>今週の成長</div>
            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 13, color: V.green }}>
              {streak > 0 ? `+${streak * 5}%` : "記録中"}
            </div>
          </div>
          <SidebarSparkline scores={history.map(r => r.evaluation.overallScore).reverse()} />
        </div>

        <div style={{ flex: 1 }} />

        {/* CTA */}
        <Link href="/session" style={{ background: V.coral, color: "#fff", border: "none", borderRadius: 14, padding: "14px 16px", fontFamily: V.round, fontWeight: 700, fontSize: 14, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: `0 10px 22px -10px ${V.coral}` }}>
          <div>
            <div>新しい練習を始める</div>
            <div style={{ fontFamily: V.sans, fontSize: 10.5, fontWeight: 400, marginTop: 2, opacity: 0.92 }}>3 つのシナリオから</div>
          </div>
          <span style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "grid", placeItems: "center", fontSize: 14 }}>→</span>
        </Link>
      </aside>

      {/* ── Header ── */}
      <header style={{ gridArea: "header", height: 64, padding: "0 28px", background: V.surface, borderBottom: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: V.blue, display: "grid", placeItems: "center", color: "#fff", fontFamily: V.round, fontWeight: 700, fontSize: 18, boxShadow: `0 6px 14px -6px ${V.blue}` }}>聴</div>
          <div>
            <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 15, color: V.ink, lineHeight: 1 }}>AIコーチトレーナー</div>
            <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 3 }}>安心して、ことばを試せる場所。</div>
          </div>
          <div style={{ width: 1, height: 28, background: V.border, margin: "0 8px" }} />
          <div>
            <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 14, color: V.ink, lineHeight: 1 }}>評価レポート</div>
            <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 3 }}>練習 #{practiceNo} ・ {dateStr}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: V.coralLite, color: V.coral, padding: "6px 12px", borderRadius: 999, fontFamily: V.round, fontWeight: 600, fontSize: 12 }}>
              <span style={{ fontSize: 14 }}>♥</span>
              <span>連続 {streak} 日</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${V.blue}, ${V.blueDeep})`, color: "#fff", display: "grid", placeItems: "center", fontFamily: V.round, fontWeight: 700, fontSize: 13 }}>
              {session.scenario.clientName.charAt(0)}
            </div>
            <div>
              <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 13, color: V.ink, lineHeight: 1 }}>コーチ</div>
              <div style={{ fontFamily: V.sans, fontSize: 10, color: V.ink3, marginTop: 2 }}>練習 #{practiceNo}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ gridArea: "main", padding: "24px 32px 32px", overflow: "auto", minHeight: 0 }}>

        {/* Row 1: 総合スコア ＋ 360°パフォーマンス */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginBottom: 18 }}>

          {/* 総合スコアカード */}
          <div style={{ ...card, padding: "22px 24px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 13, color: V.ink }}>総合スコア</div>
              <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3 }}>練習 #{practiceNo}</div>
            </div>

            <div style={{ position: "relative", margin: "14px auto", width: 168, height: 168 }}>
              <RadialGauge value={score} />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                <div>
                  <CountUpDisplay value={score} />
                  <div style={{ fontFamily: V.round, fontSize: 11, color: V.ink3, marginTop: 6, fontWeight: 600 }}>/ 100 点</div>
                </div>
              </div>
            </div>

            {/* 進捗ドット */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 14 }}>
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < Math.floor(score / 10) ? V.blue : V.border }} />
              ))}
            </div>

            {/* 前回比リボン */}
            {history.length >= 2 && (
              <div style={{ background: V.greenLite, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontFamily: V.sans, fontSize: 12, color: V.greenDark }}>
                  前回より <b style={{ fontFamily: V.round, fontSize: 14 }}>
                    {score - history[1].evaluation.overallScore >= 0
                      ? `+${score - history[1].evaluation.overallScore} 点`
                      : `${score - history[1].evaluation.overallScore} 点`}
                  </b>
                </div>
                {streak > 0 && (
                  <div style={{ fontFamily: V.sans, fontSize: 11, color: "#3A8542" }}>↑ 連続 {streak} 回上昇中</div>
                )}
              </div>
            )}

            {/* メタリスト */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontFamily: V.sans, fontSize: 12 }}>
              {[
                ["練習日",       `${dateStr} ・ ${weekdays[today.getDay()]}`],
                ["シナリオ",     session.scenario.title],
                ["クライアント", session.scenario.clientName + "さん"],
                ["対話時間",     duration],
                ["発話数",       `${totalMsgs} ／ ${session.scenario.clientName.split(" ")[0]} ${totalMsgs - userMsgs} ・ あなた ${userMsgs}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", paddingBottom: 8, borderBottom: `1px dashed ${V.borderSoft}` }}>
                  <span style={{ color: V.ink3 }}>{k}</span>
                  <span style={{ color: V.ink, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 360° パフォーマンスカード */}
          <div style={{ ...card, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.ink }}>360° パフォーマンス</div>
                <div style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, marginTop: 4 }}>
                  6 軸で AI がコーチングスキルを評価します。
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: V.blue, display: "inline-block" }} />
                  <span style={{ fontFamily: V.sans, fontSize: 12, color: V.ink2, fontWeight: 500 }}>AI 評価</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "center" }}>
              <div style={{ display: "grid", placeItems: "center" }}>
                <RadarChart axes={axes} size={280} />
              </div>
              {/* 軸ブレークダウン */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {axes.map(a => {
                  const aiPct = (a.ai / a.max) * 100;
                  return (
                    <div key={a.key} style={{ display: "grid", gridTemplateColumns: "88px 1fr 52px", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: `1px dashed ${V.borderSoft}` }}>
                      <div>
                        <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 13, color: V.ink }}>{a.label}</div>
                        <div style={{ fontFamily: V.sans, fontSize: 10, color: V.ink3 }}>{a.short}</div>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: V.blue, flexShrink: 0 }} />
                          <div style={{ flex: 1, height: 5, background: V.bg, borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${aiPct}%`, height: "100%", background: V.blue }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontFamily: V.round, fontWeight: 700, fontSize: 12, color: V.ink }}>
                        {a.ai}
                        <div style={{ fontFamily: V.sans, fontSize: 9, color: V.ink3, fontWeight: 400 }}>/20</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: 詳細分析 ＋ ふりかえり */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginBottom: 18 }}>

          {/* 詳細分析カード */}
          <div style={{ ...card, padding: "22px 24px" }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.ink }}>詳細分析</div>
              <div style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, marginTop: 4 }}>今回の練習からの所見</div>
            </div>

            {/* 強みカード */}
            <div style={{ background: V.greenLite, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
              <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: V.greenDark, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>✔</span> 強み
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {strongest.map(a => (
                  <div key={a.key} style={{ fontFamily: V.sans, fontSize: 13, color: V.ink, display: "flex", justifyContent: "space-between" }}>
                    <span>{a.label}</span>
                    <span style={{ fontFamily: V.round, fontSize: 12, fontWeight: 600, color: V.greenDark }}>高水準で安定</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 余白カード */}
            <div style={{ background: V.coralLite, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: "#B3433F", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <span>⚠</span> 余白
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {weakest.map(a => {
                  const potential = 20 - a.ai;
                  return (
                    <div key={a.key} style={{ fontFamily: V.sans, fontSize: 13, color: V.ink, display: "flex", justifyContent: "space-between" }}>
                      <span>{a.label}</span>
                      <span style={{ fontFamily: V.round, fontSize: 12, fontWeight: 600, color: "#B3433F" }}>+{potential} を狙いたい</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 前回の宿題 */}
            {hasPrevReview && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 12, color: V.ink3, letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
                  前回の宿題 ／ REVIEW
                </div>
                {result.previousImprovementsReview!.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: r.addressed ? V.green : V.surface, border: `1.5px solid ${r.addressed ? V.green : V.coral}`, color: "#fff", display: "grid", placeItems: "center", fontFamily: V.round, fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
                      {r.addressed ? "✓" : "−"}
                    </div>
                    <div>
                      <div style={{ fontFamily: V.sans, fontSize: 12.5, color: V.ink, fontWeight: 500 }}>{r.item}</div>
                      <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3, marginTop: 2, lineHeight: 1.6 }}>{r.comment}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ふりかえりカード（アコーディオン） */}
          <div style={{ ...card, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.ink }}>ふりかえり</div>
                <div style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, marginTop: 4 }}>
                  今回のセッションを 3 つの観点で分解しました。クリックで展開できます。
                </div>
              </div>
              <div style={{ background: V.blueLite, color: V.blue, padding: "4px 10px", borderRadius: 999, fontFamily: V.round, fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>
                💡 AI からのフィードバック
              </div>
            </div>

            {groups.map(group => {
              const open = expanded === group.id;
              return (
                <div key={group.id} style={{ marginBottom: 10, borderRadius: 14, background: group.bg, border: `1px solid ${open ? group.color : "transparent"}`, transition: "all 0.15s", overflow: "hidden" }}>
                  <button
                    onClick={() => toggle(group.id)}
                    aria-expanded={open}
                    aria-controls={`panel-${group.id}`}
                    style={{ width: "100%", border: "none", background: "transparent", padding: "14px 18px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 10, background: "#fff", color: group.dark, display: "grid", placeItems: "center", fontSize: 16, flexShrink: 0 }}>
                      {group.icon}
                    </span>
                    <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 14, color: group.dark, flex: 1 }}>
                      {group.title}
                      <span style={{ marginLeft: 8, color: group.color, fontSize: 12 }}>{group.count} 件</span>
                    </div>
                    <span aria-hidden="true" style={{ fontFamily: V.round, fontSize: 14, color: group.dark, fontWeight: 700, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>⌄</span>
                  </button>
                  {open && (
                    <div id={`panel-${group.id}`} role="region">
                      {group.items.map((it, i) => (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "10px 18px", borderTop: `1px dashed ${V.border}` }}>
                          <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", color: group.dark, display: "grid", placeItems: "center", fontFamily: V.round, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                          <div>
                            <div style={{ fontFamily: V.round, fontWeight: 600, fontSize: 13.5, color: V.ink }}>{it.title}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* アクション行 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, paddingTop: 14, borderTop: `1px solid ${V.borderSoft}` }}>
              <Link href="/history" style={{ background: "transparent", color: V.ink2, border: `1px solid ${V.border}`, borderRadius: 10, padding: "10px 16px", fontFamily: V.round, fontWeight: 600, fontSize: 13, textDecoration: "none", display: "inline-block" }}>
                ← 練習履歴
              </Link>
              <div style={{ flex: 1 }} />
              <Link href="/session" style={{ background: V.coral, color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontFamily: V.round, fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: `0 10px 22px -10px ${V.coral}`, display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
                次の練習を始める <span style={{ fontSize: 14 }}>▶</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Row 3: 成長トレンド */}
        <div style={{ ...card, padding: "22px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.ink }}>成長トレンド</div>
              <div style={{ fontFamily: V.sans, fontSize: 12, color: V.ink3, marginTop: 4 }}>
                過去 {allScores.length} 回のセッションスコア。続けるほど、傾向は確かに登っていきます。
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }} role="group" aria-label="期間切り替え">
              {["10 回", "30 回", "全期間"].map((t, i) => (
                <button key={t} onClick={() => setTrendPeriod(i)}
                  aria-pressed={trendPeriod === i}
                  style={{ fontFamily: V.round, fontWeight: 600, fontSize: 12, padding: "6px 12px", borderRadius: 8, background: trendPeriod === i ? V.ink : "transparent", color: trendPeriod === i ? "#fff" : V.ink2, border: trendPeriod === i ? "none" : `1px solid ${V.border}`, cursor: "pointer" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 32, alignItems: "center" }}>
            <GrowthChart data={allScores} />
            <div>
              {[
                { k: "平均スコア",  v: `${avgScore} 点`,  d: history.length > 0 ? `初回比 +${avgScore - (history[history.length-1]?.evaluation.overallScore ?? avgScore)}` : "初回" },
                { k: "上昇傾向",    v: `${streak} 回連続`, d: streak > 0 ? "止まらず登る" : "次回に期待" },
                { k: "練習頻度",    v: freq,               d: "継続中" },
                { k: "到達まで",    v: `あと ${Math.max(0, 100 - score)} 点`, d: "目標 100 点" },
              ].map(s => (
                <div key={s.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: `1px dashed ${V.borderSoft}` }}>
                  <div>
                    <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3 }}>{s.k}</div>
                    <div style={{ fontFamily: V.round, fontSize: 18, fontWeight: 700, color: V.ink, marginTop: 2 }}>{s.v}</div>
                  </div>
                  <div style={{ fontFamily: V.sans, fontSize: 11, color: V.ink3 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      {/* スピナーキーフレーム */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── CountUp 表示コンポーネント（状態を親から分離） ── */
function CountUpDisplay({ value }: { value: number }) {
  const n = useCountUp(value, 900);
  return (
    <span style={{ fontFamily: '"M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif', fontSize: 56, fontWeight: 700, color: "#2D3436", lineHeight: 1 }}>
      {n}
    </span>
  );
}
