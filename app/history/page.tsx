"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { OralResult, ReflectionNotes, SessionRecord } from "@/types";
import { ORAL_QUESTIONS } from "@/lib/oral";
import { getSettings, HistoryView } from "@/lib/settings";
import SkillDiagnosis from "@/components/SkillDiagnosis";

/* ══════════════════════════════════════════════════════════════════════
   デザイントークン（v3）
══════════════════════════════════════════════════════════════════════ */
const V = {
  navy:    "#F5F1FF",
  navyLt:  "rgba(244,114,182,0.14)",
  green:   "#5FD3A0",
  greenLt: "rgba(95,211,160,0.14)",
  greenDk: "#7EE0B5",
  coral:   "#FF8A80",
  coralLt: "rgba(255,138,128,0.14)",
  amber:   "#FBBF24",
  amberLt: "rgba(251,191,36,0.14)",
  bg:      "rgba(255,255,255,0.05)",
  surface: "rgba(255,255,255,0.045)",
  ink:     "#FFFFFF",
  ink2:    "#CFC9E4",
  ink3:    "#8F8AA8",
  border:  "rgba(255,255,255,0.07)",
  borderSoft: "rgba(255,255,255,0.06)",
  sans:  '"Plus Jakarta Sans","Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  round: '"Plus Jakarta Sans","Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
  accent:  "linear-gradient(135deg, #F472B6 0%, #D946EF 100%)",
  accentShadow: "0 8px 20px -8px rgba(217,70,239,0.6)",
} as const;

/* ── ユーティリティ ── */
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}

function scoreColor(s: number) {
  return s >= 80 ? V.green : s >= 60 ? V.navy : V.amber;
}

/* ── スパークライン ── */
function Sparkline({ scores }: { scores: number[] }) {
  const n = Math.min(scores.length, 10);
  const slice = scores.slice(-n);
  if (slice.length < 2) return (
    <svg viewBox="0 0 160 40" width="160" height="40" style={{ display: "block" }}>
      <path d="M0 30 L160 20" fill="none" stroke={V.green} strokeWidth="2" />
    </svg>
  );
  const pts = slice.map((v, i) => {
    const px = (i / (n - 1)) * 156 + 2;
    const py = 35 - (v / 100) * 28;
    return `${px} ${py}`;
  }).join(" L");
  const last = slice[slice.length - 1];
  const lx = 158, ly = 35 - (last / 100) * 28;
  return (
    <svg viewBox="0 0 160 40" width="160" height="40" style={{ display: "block" }}>
      <defs>
        <linearGradient id="hist-spark3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={V.navy} stopOpacity="0.2" />
          <stop offset="100%" stopColor={V.navy} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M${pts} L${lx} 40 L2 40 Z`} fill="url(#hist-spark3)" />
      <path d={`M${pts}`} fill="none" stroke={V.navy} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="3.5" fill={V.coral} stroke="white" strokeWidth="2" />
    </svg>
  );
}

/* ── スコアミニバー ── */
function MiniBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = (score / maxScore) * 100;
  const color = pct >= 80 ? V.green : pct >= 60 ? V.navy : V.amber;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: V.borderSoft, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: V.round, fontSize: 11, color: V.ink2, fontWeight: 600, width: 36, textAlign: "right" }}>
        {score.toFixed(0)}/{maxScore}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   メインページ
══════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════
   振り返りシート（展開パネル）の部品
══════════════════════════════════════════════ */
const SHEET_BOX: React.CSSProperties = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
};

function SheetTitle({ badge, title, sub }: { badge: string; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
      <span style={{ display: "inline-grid", placeItems: "center", minWidth: 24, height: 24, padding: "0 7px", borderRadius: 8, background: V.accent, color: "white", fontSize: 11.5, fontWeight: 800 }}>{badge}</span>
      <span style={{ fontFamily: V.round, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>{title}</span>
      {sub && <span style={{ fontSize: 11.5, color: V.ink3 }}>{sub}</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ ...SHEET_BOX, padding: "11px 14px" }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: V.ink3, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: V.ink, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}

const LAYER_META = [
  { key: "action" as const, name: "行動層", hint: "やりがい・達成感", color: V.amber },
  { key: "role" as const, name: "役割層", hint: "役割・責任", color: V.coral },
  { key: "being" as const, name: "存在層", hint: "生きがい・価値観", color: "#F472B6" },
];

function dimmed(v: string) {
  return v.trim() === "—" || v.trim() === "未実施" || v.trim() === "";
}

function NumberInput({ value, onChange, placeholder }: { value?: number; onChange: (v: number | undefined) => void; placeholder: string }) {
  return (
    <input
      type="number"
      min={0}
      max={100}
      inputMode="numeric"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const n = e.target.value === "" ? undefined : Math.max(0, Math.min(100, Number(e.target.value)));
        onChange(n);
      }}
      className="tnum"
      style={{ width: 84, borderRadius: 12, border: "none", outline: "none", background: "rgba(255,255,255,0.07)", color: V.ink, fontSize: 18, fontWeight: 800, padding: "9px 12px", fontFamily: V.sans }}
    />
  );
}

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", resize: "vertical", borderRadius: 14, border: "none", outline: "none", background: "rgba(255,255,255,0.07)", color: V.ink, fontSize: 13, lineHeight: 1.8, padding: "11px 14px", fontFamily: V.sans }}
    />
  );
}

/** 口頭試問と面接官評価（口頭試問を受けた場合だけ） */
function OralResultView({ oral, basic = false }: { oral: OralResult; basic?: boolean }) {
  const meta = Object.fromEntries(ORAL_QUESTIONS.map((q) => [q.key, q])) as Record<string, (typeof ORAL_QUESTIONS)[number]>;
  const list = (items: string[], color: string) =>
    items.length > 0 && (
      <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((t, i) => (
          <li key={i} style={{ fontSize: 12.5, color: V.ink2, lineHeight: 1.8 }}><span style={{ color }}>{t}</span></li>
        ))}
      </ul>
    );

  return (
    <section>
      <SheetTitle badge="面接官" title="口頭試問と面接官評価" sub="面接官の5つの質問への答えを、評価しました" />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ ...SHEET_BOX, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: V.ink3 }}>総合</span>
            <span className="tnum" style={{ fontFamily: V.round, fontSize: 30, fontWeight: 800, lineHeight: 1, color: scoreColor(oral.overall) }}>{oral.overall}</span>
            <span style={{ fontSize: 11.5, color: V.ink3 }}>/ 100点</span>
          </div>
          {oral.summary && <p style={{ margin: "0 0 12px", fontSize: 13, color: V.ink, lineHeight: 1.85 }}>{oral.summary}</p>}
          {oral.strengths.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: V.greenDk, marginBottom: 4 }}>強み</div>
              {list(oral.strengths, V.ink2)}
            </div>
          )}
          {oral.improvements.length > 0 && (
            <div style={{ marginBottom: oral.consistency ? 10 : 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: V.amber, marginBottom: 4 }}>次に向けた課題</div>
              {list(oral.improvements, V.ink2)}
            </div>
          )}
          {oral.consistency && (
            <div style={{ borderRadius: 12, background: V.navyLt, padding: "9px 12px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#F9A8D4", marginRight: 8 }}>整合性</span>
              <span style={{ fontSize: 12.5, color: V.ink, lineHeight: 1.8 }}>{oral.consistency}</span>
            </div>
          )}
        </div>

        {/* ①できたこと 以降（5つの質問ごとの答えと講評）は、Pro だけで表示する */}
        {!basic && oral.items.map((it) => {
          const m = meta[it.key];
          return (
            <div key={it.key} style={{ ...SHEET_BOX, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px" }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}><span style={{ color: "#F9A8D4", marginRight: 6 }}>{m?.n}</span>{m?.title}</span>
                    <span style={{ fontSize: 10.5, color: V.ink3 }}>{m?.hint}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="tnum" style={{ fontFamily: V.round, fontSize: 24, fontWeight: 800, lineHeight: 1, color: typeof it.score === "number" ? scoreColor(it.score) : V.ink3 }}>{typeof it.score === "number" ? it.score : "—"}</span>
                  <span style={{ fontSize: 11, color: V.ink3 }}> / 100点</span>
                </div>
              </div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: V.ink3, marginBottom: 2 }}>あなたの答え</div>
              <p style={{ margin: "0 0 10px", fontSize: 12.5, color: V.ink2, lineHeight: 1.85, wordBreak: "break-word" }}>{it.answer || "（無回答）"}</p>
              {it.headline && <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: V.ink, lineHeight: 1.75 }}>{it.headline}</p>}
              {it.good && (
                <p style={{ margin: "0 0 6px", fontSize: 12.5, color: V.ink2, lineHeight: 1.85 }}>
                  <strong style={{ color: V.greenDk, marginRight: 8 }}>良かった点</strong>{it.good}
                </p>
              )}
              {it.improve && (
                <p style={{ margin: 0, fontSize: 12.5, color: V.ink2, lineHeight: 1.85 }}>
                  <strong style={{ color: V.amber, marginRight: 8 }}>補うとよい点</strong>{it.improve}
                </p>
              )}
              {!it.headline && !it.good && !it.improve && (
                <p style={{ margin: 0, fontSize: 12, color: V.ink3 }}>この質問の評価を、作れませんでした。</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 発言ごとの評価（コーチの発言1つずつに、点数・良かった点・高めるポイント） */
function UtteranceFeedbackView({
  record, onUpdate,
}: {
  record: SessionRecord;
  onUpdate: (patch: Partial<SessionRecord>) => void;
}) {
  const items = record.utterances;
  const messages = record.session.messages;
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluable = messages.filter((m, i) => m.role === "user" && i > 0 && m.content.trim()).length;

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, scenario: record.session.scenario }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "発言ごとの評価を作れませんでした");
      onUpdate({ utterances: data.items });
    } catch (e) {
      setError(e instanceof Error ? e.message : "発言ごとの評価を作れませんでした");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section>
      <SheetTitle badge="発言" title="発言ごとの評価" sub="あなたの発言を、1つずつ振り返ります" />
      {!items ? (
        <div style={{ ...SHEET_BOX, padding: "22px", textAlign: "center" }}>
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: V.ink3, lineHeight: 1.8 }}>
            あなたの発言ごとに、点数・良かった点・さらに高めるポイントをまとめます。
          </p>
          <button
            onClick={generate}
            disabled={generating || evaluable === 0}
            className="btn-primary"
            style={{ border: "none", cursor: generating ? "default" : "pointer", background: V.accent, color: "white", fontWeight: 700, fontSize: 13, padding: "11px 24px", borderRadius: 999, opacity: generating || evaluable === 0 ? 0.5 : 1, fontFamily: V.sans }}
          >
            {generating ? "評価中…（1分ほどかかります）" : "発言ごとの評価を作成する"}
          </button>
          {evaluable === 0 && <p style={{ margin: "10px 0 0", fontSize: 11.5, color: V.ink3 }}>評価できる発言がありません。</p>}
          {error && <p style={{ margin: "10px 0 0", fontSize: 12, color: V.coral }}>{error}</p>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((it, n) => (
            <div key={it.index} style={{ ...SHEET_BOX, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: V.ink3, marginBottom: 4 }}>発言 {n + 1}</div>
                  <p style={{ margin: 0, fontSize: 13, color: V.ink, lineHeight: 1.75, wordBreak: "break-word" }}>{messages[it.index]?.content}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="tnum" style={{ fontFamily: V.round, fontSize: 28, fontWeight: 800, lineHeight: 1, color: scoreColor(it.score) }}>{it.score}</span>
                  <span style={{ fontSize: 11.5, color: V.ink3 }}> / 100点</span>
                </div>
              </div>
              {it.headline && <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: V.ink, lineHeight: 1.75 }}>{it.headline}</p>}
              {it.goods.length > 0 && (
                <div style={{ marginBottom: it.improves.length > 0 ? 12 : 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: V.greenDk, marginBottom: 6 }}>良かった点</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {it.goods.map((g, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: V.ink2, lineHeight: 1.8 }}>
                        <strong style={{ color: V.ink }}>{g.title}</strong>{g.title && g.body ? "　" : ""}{g.body}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {it.improves.length > 0 && (
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: V.amber, marginBottom: 6 }}>さらに完成度を高めるためのポイント</div>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {it.improves.map((g, i) => (
                      <li key={i} style={{ fontSize: 12.5, color: V.ink2, lineHeight: 1.8 }}>
                        <strong style={{ color: V.ink }}>{g.title}</strong>{g.title && g.body ? "　" : ""}{g.body}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          <div style={{ textAlign: "right" }}>
            <button
              onClick={generate}
              disabled={generating}
              className="btn-ghost"
              style={{ border: "none", cursor: generating ? "default" : "pointer", background: "transparent", color: "#F9A8D4", fontSize: 11.5, fontWeight: 700, padding: "6px 12px", borderRadius: 999, boxShadow: "inset 0 0 0 1px rgba(244,114,182,0.35)", fontFamily: V.sans, opacity: generating ? 0.5 : 1 }}
            >
              {generating ? "評価中…（1分ほどかかります）" : "評価をやり直す"}
            </button>
            {error && <p style={{ margin: "8px 0 0", fontSize: 12, color: V.coral }}>{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

/** 1件分の振り返りシート */
function ReflectionSheetView({
  record, onUpdate, onDelete, basic,
}: {
  record: SessionRecord;
  onUpdate: (patch: Partial<SessionRecord>) => void;
  onDelete: () => void;
  basic: boolean;   // Free: 基本情報と面接官評価だけ
}) {
  const sc = record.session.scenario;
  const ev = record.evaluation;
  const sheet = ev.sheet;
  const notes = record.reflection ?? {};
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const setNotes = (patch: Partial<ReflectionNotes>) => onUpdate({ reflection: { ...notes, ...patch } });

  const generate = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: record.session.messages, scenario: sc }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "シートを作成できませんでした");
      onUpdate({ evaluation: { ...ev, sheet: data } });
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "シートを作成できませんでした");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ borderTop: `1px solid ${V.borderSoft}`, padding: "22px", display: "flex", flexDirection: "column", gap: 26 }}>

      {/* ── 基本情報 ── */}
      <section>
        <SheetTitle badge="基本" title="基本情報" />
        <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="実施日">{formatDate(record.savedAt)}</Field>
          <Field label="ケース・クライエント名">{sc.title}／{sc.clientName}さん</Field>
          <Field label="属性・役職">{sc.clientRole || "—"}</Field>
          <Field label="相談場面・導入状況">{sheet?.situation || sc.situation || "—"}</Field>
        </div>
      </section>

      {/* ── 口頭試問と面接官評価（受けた場合） ── */}
      {record.oral && <OralResultView oral={record.oral} basic={basic} />}

      {basic && !record.oral && (
        <p style={{ margin: 0, fontSize: 12.5, color: V.ink3, lineHeight: 1.8 }}>
          このセッションは、口頭試問と面接官評価を受けていません。🔒 マイページで Pro に切り替えると、発言ごとの評価や振り返りシートを見られます。
        </p>
      )}

      {/* ── 発言ごとの評価 ── */}
      {!basic && <UtteranceFeedbackView record={record} onUpdate={onUpdate} />}

      {basic ? null : !sheet ? (
        <section style={{ ...SHEET_BOX, padding: "22px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>このセッションの振り返りシートは、まだ作成されていません</div>
          <p style={{ margin: "0 0 14px", fontSize: 12.5, color: V.ink3, lineHeight: 1.8 }}>会話の記録から、面談プロセス・口頭試問の整合性・キークエスチョンを自動でまとめます。</p>
          <button
            onClick={generate}
            disabled={generating || record.session.messages.length === 0}
            className="btn-primary"
            style={{ border: "none", cursor: generating ? "default" : "pointer", background: V.accent, color: "white", fontWeight: 700, fontSize: 13, padding: "11px 24px", borderRadius: 999, opacity: generating || record.session.messages.length === 0 ? 0.5 : 1, fontFamily: V.sans }}
          >
            {generating ? "作成中…（1分ほどかかります）" : "シートを作成する"}
          </button>
          {record.session.messages.length === 0 && <p style={{ margin: "10px 0 0", fontSize: 11.5, color: V.ink3 }}>会話の記録が残っていないため、作成できません。</p>}
          {genError && <p style={{ margin: "10px 0 0", fontSize: 12, color: V.coral }}>{genError}</p>}
        </section>
      ) : (
        <>
          {/* ── A. 面談プロセス分析 ── */}
          <section>
            <SheetTitle badge="A" title="面談プロセス分析" sub="三層モデルの推移" />

            {(sheet.layers.role || sheet.layers.action || sheet.layers.being) && (
              <div className="rs-grid-1" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                {LAYER_META.map((l) => (
                  <div key={l.key} style={{ ...SHEET_BOX, padding: "12px 14px", borderTop: `3px solid ${l.color}` }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: l.color }}>{l.name}</span>
                      <span style={{ fontSize: 10.5, color: V.ink3 }}>{l.hint}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: V.ink2, lineHeight: 1.75 }}>{sheet.layers[l.key] || "—"}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="sheet-table">
              <div className="sheet-head">
                <span>フェーズ</span><span>クライエントの状態・発言の要点</span><span>CCの意図的な関わり・発問</span><span>変化・内省の深化度</span>
              </div>
              {sheet.phases.map((p, i) => (
                <div key={p.phase} className="sheet-row" style={{ opacity: dimmed(p.change) ? 0.55 : 1 }}>
                  <div className="sheet-phase"><span className="tnum" style={{ color: "#F9A8D4", marginRight: 6 }}>{i + 1}</span>{p.phase.replace("（役割・行動層）", "").replace("（価値観）", "")}</div>
                  <div><span className="sheet-lab">クライエントの状態・発言の要点</span>{p.client}</div>
                  <div><span className="sheet-lab">CCの意図的な関わり・発問</span>{p.cc}</div>
                  <div><span className="sheet-lab">変化・内省の深化度</span>{p.change}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── B. 口頭試問 整合性マトリクス ── */}
          <section>
            <SheetTitle badge="B" title="口頭試問 整合性マトリクス" sub="5問が一つのストーリーになっているか" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { n: "①", title: "できたこと", hint: "CCの具体的介入 → クライエントの気づき", body: sheet.oral.done },
                { n: "②", title: "改善点", hint: "やり残した点・もう一歩寄り添えた感情", body: sheet.oral.improve },
                { n: "③", title: "主訴", hint: "客観的事実＋主観的苦悩・葛藤", body: sheet.oral.complaint },
                { n: "④", title: "見立て", hint: "心理的課題・自己概念の歪み", body: sheet.oral.view },
                { n: "⑤", title: "今後の面談方針", hint: "次回以降の具体的支援（スモールステップ）", body: sheet.oral.plan },
              ].map((o) => (
                <div key={o.n} style={{ ...SHEET_BOX, padding: "13px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "2px 10px", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800 }}><span style={{ color: "#F9A8D4", marginRight: 6 }}>{o.n}</span>{o.title}</span>
                    <span style={{ fontSize: 10.5, color: V.ink3 }}>{o.hint}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: V.ink2, lineHeight: 1.85 }}>{o.body || "—"}</p>
                </div>
              ))}
              {sheet.consistency && (
                <div style={{ borderRadius: 14, background: V.navyLt, padding: "11px 14px" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#F9A8D4", marginRight: 8 }}>整合性</span>
                  <span style={{ fontSize: 12.5, color: V.ink, lineHeight: 1.8 }}>{sheet.consistency}</span>
                </div>
              )}
            </div>
          </section>

          {/* ── C. キークエスチョン ── */}
          <section>
            <SheetTitle badge="C" title="決め手になったキークエスチョン" sub="再現できる問いとして蓄積" />
            {sheet.keyQuestions.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12.5, color: V.ink3 }}>今回は、決め手になった問いを抽出できませんでした。</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sheet.keyQuestions.map((k, i) => (
                  <div key={i} style={{ ...SHEET_BOX, padding: "13px 16px", position: "relative" }}>
                    <span aria-hidden style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 3, borderRadius: 3, background: V.accent }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span className="tnum" style={{ fontSize: 11, fontWeight: 800, color: "#F9A8D4" }}>問い{i + 1}</span>
                      {k.label && <span style={{ fontSize: 11, color: V.ink3 }}>（{k.label}）</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.7 }}>「{k.question}」</p>
                    {k.effect && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: V.ink2, lineHeight: 1.8 }}>{k.effect}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── D. 総合得点・自己フィードバック ── */}
      {!basic && <section>
        <SheetTitle badge="D" title="総合得点・自己フィードバック" />
        <div style={{ ...SHEET_BOX, padding: "16px 18px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "14px 28px" }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: V.ink3, marginBottom: 6 }}>AI採点</div>
              <div className="tnum" style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, color: scoreColor(ev.overallScore) }}>{ev.overallScore}<span style={{ fontSize: 13, color: V.ink3, fontWeight: 600 }}> / 100</span></div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: V.ink3, marginBottom: 6 }}>自己採点</div>
              <NumberInput value={notes.selfScore} onChange={(v) => setNotes({ selfScore: v })} placeholder="—" />
            </div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em", color: V.ink3, marginBottom: 6 }}>目標点</div>
              <NumberInput value={notes.targetScore} onChange={(v) => setNotes({ targetScore: v })} placeholder="100" />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>次回ケースへ持ち越す実践テーマ</span>
              {sheet?.nextTheme && !notes.nextTheme && (
                <button onClick={() => setNotes({ nextTheme: sheet.nextTheme })} className="btn-ghost" style={{ border: "none", cursor: "pointer", background: "transparent", color: "#F9A8D4", fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, boxShadow: "inset 0 0 0 1px rgba(244,114,182,0.35)", fontFamily: V.sans }}>
                  AIの提案を入れる
                </button>
              )}
            </div>
            <TextArea
              value={notes.nextTheme ?? ""}
              onChange={(v) => setNotes({ nextTheme: v })}
              placeholder={sheet?.nextTheme ? `例）${sheet.nextTheme}` : "次の面談で意識することを書く"}
            />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>メモ</div>
            <TextArea value={notes.memo ?? ""} onChange={(v) => setNotes({ memo: v })} placeholder="気づき、口頭試問で話したいこと など" rows={2} />
          </div>

          {ev.scores.length > 0 && (
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px 18px" }}>
              {ev.scores.map((s) => (
                <div key={s.category}>
                  <div style={{ fontSize: 11.5, color: V.ink2, marginBottom: 4 }}>{s.category}</div>
                  <MiniBar score={s.score} maxScore={s.maxScore} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {basic ? (
          <>
            {/* 左に、削除ボタンと同じ幅の見えない枠を置いて、文を行の中央に揃える */}
            <span aria-hidden style={{ visibility: "hidden", fontSize: 11, border: "1px solid transparent", padding: "7px 14px" }}>削除</span>
            <span style={{ flex: 1, minWidth: 0, textAlign: "center", fontSize: 13.5, fontWeight: 700, color: "#F9A8D4", lineHeight: 1.6 }}>
              🔒 面談プロセス・発言ごとの評価・振り返りシートは、Pro で確認できます
            </span>
          </>
        ) : (
          <>
            <span style={{ fontSize: 11, color: V.ink3 }}>自己採点・テーマ・メモは、入力すると自動で保存されます</span>
            <div style={{ flex: 1 }} />
          </>
        )}
        <button onClick={onDelete} style={{ fontSize: 11, color: V.ink3, background: "transparent", border: `1px solid ${V.border}`, borderRadius: 999, padding: "7px 14px", cursor: "pointer", fontFamily: V.sans }}>
          削除
        </button>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<HistoryView>("standard"); // プランの切り替えは、マイページで行う


  useEffect(() => {
    setView(getSettings().historyView);
    const raw = localStorage.getItem("sessionHistory");
    if (raw) setRecords(JSON.parse(raw));
    // 面談の終了後は、できたばかりの記録を開いた状態で表示する
    const open = new URLSearchParams(window.location.search).get("open");
    if (open) setExpanded(new Set([open]));
    setLoaded(true);
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateRecord = (id: string, patch: Partial<SessionRecord>) => {
    setRecords((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      try { localStorage.setItem("sessionHistory", JSON.stringify(updated)); } catch { /* 容量超過などは無視 */ }
      return updated;
    });
  };

  const deleteRecord = (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    localStorage.setItem("sessionHistory", JSON.stringify(updated));
  };

  const avgScore = records.length > 0
    ? Math.round(records.reduce((s, r) => s + r.evaluation.overallScore, 0) / records.length) : 0;

  const scores = records.map(r => r.evaluation.overallScore).reverse();

  const streak = (() => {
    let s = 0;
    for (let i = 0; i < records.length - 1; i++) {
      if (records[i].evaluation.overallScore > records[i + 1].evaluation.overallScore) s++;
      else break;
    }
    return s;
  })();

  if (!loaded) return null;

  const card: React.CSSProperties = {
    background: V.surface,
    border: `1px solid ${V.border}`,
    borderRadius: 22,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 40px -28px rgba(8,4,24,0.9)", backdropFilter: "blur(14px)",
  };

  return (
    <div className="screen-minh" style={{ background: "transparent", fontFamily: V.sans }}>

      {/* ─── ページヘッダー ─── */}
      <div className="rs-px reveal hist-head" style={{ padding: "12px 32px 0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 0" }}>
            <h1 className="text-grad" style={{ fontSize: "clamp(30px, 4.4vw, 46px)", fontWeight: 800, margin: 0, letterSpacing: "-0.035em", lineHeight: 1.1 }}>
              ふりかえり
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {streak > 0 && (
                <div className="rs-hide" style={{ display: "flex", alignItems: "center", gap: 6, background: V.amberLt, color: V.amber, padding: "7px 14px", borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                  🔥 {streak} 回連続上昇中
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── コンテンツ ─── */}
      <div className="rs-px hist-body" style={{ maxWidth: 1064, margin: "0 auto", padding: "12px 32px 40px" }}>

        {/* 面談スキルの診断（レーダー・強みと伸びしろ・次の一手） */}
        {records.length > 0 && <SkillDiagnosis records={records} />}

        {/* 統計カード */}
        {records.length > 0 && (
          <div className="rs-pad" style={{ ...card, padding: "22px 28px", marginBottom: 24 }}>
            <div className="rs-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.6fr", gap: 0, alignItems: "center" }}>
              {/* セッション数 */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 36, fontWeight: 800, color: V.navy, lineHeight: 1 }}>{records.length}</div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6 }}>セッション数</div>
              </div>
              {/* 平均スコア */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 36, fontWeight: 800, color: scoreColor(avgScore), lineHeight: 1 }}>{avgScore}</div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6 }}>平均スコア</div>
              </div>
              {/* 最新スコア */}
              <div style={{ textAlign: "center", padding: "0 20px", borderRight: `1px solid ${V.borderSoft}` }}>
                <div style={{ fontFamily: V.round, fontSize: 36, fontWeight: 800, color: scoreColor(records[0].evaluation.overallScore), lineHeight: 1 }}>
                  {records[0].evaluation.overallScore}
                </div>
                <div style={{ fontSize: 11, color: V.ink3, marginTop: 6 }}>最新スコア</div>
              </div>
              {/* スパークライン */}
              <div style={{ padding: "0 20px 0 24px" }}>
                <div style={{ fontSize: 11, color: V.ink3, marginBottom: 6, fontWeight: 600 }}>スコア推移</div>
                <Sparkline scores={scores} />
              </div>
            </div>
          </div>
        )}

        {/* 練習記録リスト */}
        {records.length === 0 ? (
          <div style={{ ...card, padding: "60px 32px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontFamily: V.round, fontSize: 16, fontWeight: 700, color: V.navy, marginBottom: 8 }}>
              まだ練習記録がありません
            </div>
            <div style={{ fontSize: 13, color: V.ink3, marginBottom: 24, lineHeight: 1.7 }}>
              セッションを完了すると、ここに練習の記録が表示されます。
            </div>
            <Link
              href="/session"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 26px", background: V.accent, color: "white", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}
            >
              ▶ 最初のセッションを始める
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {records.map((record, idx) => {
              const isExpanded = expanded.has(record.id);
              const ev = record.evaluation;
              const prevScore = records[idx + 1]?.evaluation.overallScore ?? null;
              const diff = prevScore !== null ? ev.overallScore - prevScore : null;

              return (
                <div key={record.id} style={{ ...card, overflow: "hidden", transition: "box-shadow 0.15s" }}>
                  {/* ─ ヘッダー行 ─ */}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    style={{ width: "100%", border: "none", background: "transparent", padding: "18px 22px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 16 }}
                  >
                    {/* 順位 */}
                    <div style={{ fontFamily: V.round, fontSize: 12, fontWeight: 700, color: idx === 0 ? V.green : V.ink3, width: 28, textAlign: "center", flexShrink: 0 }}>
                      {idx === 0 ? "⭐" : `#${idx + 1}`}
                    </div>

                    {/* シナリオアイコン */}
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: V.bg, border: `1px solid ${V.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                      {record.session.scenario.icon}
                    </div>

                    {/* タイトル + 日時 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: V.round, fontWeight: 700, fontSize: 15, color: V.navy, lineHeight: 1.2, marginBottom: 4 }}>
                        {record.session.scenario.title}
                      </div>
                      <div style={{ fontSize: 12, color: V.ink3 }}>
                        {formatDate(record.savedAt)} ・ {record.session.scenario.clientName}さん
                      </div>
                    </div>

                    {/* スコア + 前回比 */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: V.round, fontSize: 26, fontWeight: 800, color: scoreColor(ev.overallScore), lineHeight: 1 }}>
                        {ev.overallScore}
                      </div>
                      {diff !== null && (
                        <div style={{ fontSize: 11, fontWeight: 600, color: diff >= 0 ? V.green : V.coral, marginTop: 2 }}>
                          {diff >= 0 ? `+${diff}` : diff} 点
                        </div>
                      )}
                    </div>

                    {/* 展開アイコン */}
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: V.bg, display: "grid", placeItems: "center", fontSize: 14, color: V.ink3, flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      ⌄
                    </div>
                  </button>

                  {/* ─ 展開パネル: 振り返りシート ─ */}
                  {isExpanded && (
                    <ReflectionSheetView
                      record={record}
                      onUpdate={(patch) => updateRecord(record.id, patch)}
                      onDelete={() => deleteRecord(record.id)}
                      basic={view === "basic"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
