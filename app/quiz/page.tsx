"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QUIZ_GROUPS, QuizGroup, QuizQuestion } from "@/lib/quiz";
import { trackQuiz } from "@/lib/track";
import { loadDefaultJapaneseParser } from "budoux";

/* 1問1答クイズ。グループを選ぶ → 4択で答える → すぐに○×と考え方 → 結果 */

const PROGRESS_KEY = "quizProgress";
const LETTERS = ["A", "B", "C", "D"];

/** 文節の切れ目だけで、改行できるようにする（「役|職」のように、語の途中で改行されないため） */
const jaParser = loadDefaultJapaneseParser();
const phrased = (text: string) => jaParser.parse(text).join("​");
const PHRASE_STYLE: React.CSSProperties = { wordBreak: "keep-all", overflowWrap: "anywhere" };

interface Score { score: number; total: number }
interface Progress {
  best: Score;          // 正答率が最も高かった結果
  last: Score;
  plays: number;
  updatedAt: string;
  seen: string[];       // 出題した問題の ID（未出題を優先するため）
}
type ProgressMap = Record<string, Progress>;

const COUNT_OPTIONS = [10, 25]; // 「全問」は、別に用意する

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 旧い形式（best が数字）の保存データも、読めるようにする */
function readProgress(): ProgressMap {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "{}");
    const out: ProgressMap = {};
    for (const [id, v] of Object.entries(raw as Record<string, any>)) { // eslint-disable-line @typescript-eslint/no-explicit-any
      const best: Score = typeof v.best === "number" ? { score: v.best, total: v.total ?? 6 } : v.best;
      const last: Score = typeof v.last === "number" ? { score: v.last, total: v.total ?? 6 } : v.last;
      if (!best || !last) continue;
      out[id] = { best, last, plays: v.plays ?? 1, updatedAt: v.updatedAt ?? "", seen: Array.isArray(v.seen) ? v.seen : [] };
    }
    return out;
  } catch {
    return {};
  }
}

function writeProgress(all: ProgressMap) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(all)); } catch { /* 保存できなくても、遊べる */ }
}

const rate = (s: Score) => (s.total ? s.score / s.total : 0);
const rate_ = (score: number, total: number) => (total ? score / total : 0);

/** 結果を保存する（全問・復習の区別なく、出題した問題は「出題ずみ」にする。最高点は、全問・指定数の回だけ更新） */
function saveResult(groupId: string, score: number, total: number, askedIds: string[], countsForBest: boolean, groupSize: number) {
  const all = readProgress();
  const prev = all[groupId];
  const cur: Score = { score, total };
  let seen = Array.from(new Set([...(prev?.seen ?? []), ...askedIds]));
  if (seen.length >= groupSize) seen = []; // すべて出題したら、最初から
  all[groupId] = {
    best: !countsForBest && prev ? prev.best : !prev || rate(cur) > rate(prev.best) || (rate(cur) === rate(prev.best) && total > prev.best.total) ? cur : prev.best,
    last: countsForBest ? cur : prev?.last ?? cur,
    plays: (prev?.plays ?? 0) + (countsForBest ? 1 : 0),
    updatedAt: new Date().toISOString(),
    seen,
  };
  writeProgress(all);
}

/** 出題する問題を選ぶ。まだ出していない問題を優先する */
function pickQuestions(group: QuizGroup, count: number, seen: string[]): QuizQuestion[] {
  const unseen = shuffle(group.questions.filter((q) => !seen.includes(q.id)));
  const seenQs = shuffle(group.questions.filter((q) => seen.includes(q.id)));
  return shuffle([...unseen, ...seenQs].slice(0, Math.min(count, group.questions.length)));
}

interface Run {
  group: QuizGroup;
  questions: QuizQuestion[];
  review: boolean;         // 間違えた問題の復習か（最高点には数えない）
}

export default function QuizPage() {
  const [progress, setProgress] = useState<ProgressMap>({});
  const [run, setRun] = useState<Run | null>(null);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);   // 表示上の位置
  const [results, setResults] = useState<{ q: QuizQuestion; ok: boolean }[]>([]);
  const feedbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setProgress(readProgress()); }, []);

  const finished = run !== null && idx >= run.questions.length;
  const question = run && !finished ? run.questions[idx] : null;

  // 選択肢の並びを、問題ごとに入れ替える（表示上の位置 → 元の番号）
  const order = useMemo(() => (question ? shuffle(question.choices.map((_, i) => i)) : []), [question]);

  /** count: 出題数（Infinity で全問）。only: 復習する問題 */
  const start = (group: QuizGroup, count: number, only?: QuizQuestion[]) => {
    const picked = only ? shuffle(only) : pickQuestions(group, count, readProgress()[group.id]?.seen ?? []);
    setRun({ group, questions: picked, review: !!only });
    setIdx(0);
    setPicked(null);
    setResults([]);
    window.scrollTo({ top: 0 });
  };

  const choose = (pos: number) => {
    if (!question || picked !== null) return;
    const ok = order[pos] === question.answer;
    setPicked(pos);
    trackQuiz(ok);
    setResults((r) => [...r, { q: question, ok }]);
    setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const next = () => {
    if (!run) return;
    const last = idx + 1 >= run.questions.length;
    if (last) {
      const score = results.filter((r) => r.ok).length;
      saveResult(run.group.id, score, run.questions.length, run.questions.map((q) => q.id), !run.review, run.group.questions.length);
      setProgress(readProgress());
    }
    setIdx(idx + 1);
    setPicked(null);
    window.scrollTo({ top: 0 });
  };

  const backToGroups = () => {
    setRun(null);
    setIdx(0);
    setPicked(null);
    setResults([]);
  };

  /* ───────── グループ選択 ───────── */
  if (!run) {
    return (
      <main className="screen-minh px-4 pb-10 pt-3 sm:px-8 sm:pt-6">
        <div className="mx-auto w-full max-w-[900px]">
          <div className="reveal" style={{ ["--i" as string]: 0 }}>
            <h1 className="text-grad text-[24px] font-extrabold leading-tight tracking-tight sm:text-4xl">クイズ</h1>
          </div>

          <div className="mt-3 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
            {QUIZ_GROUPS.map((g, i) => {
              const p = progress[g.id];
              const counts = [...COUNT_OPTIONS.filter((n) => n < g.questions.length), g.questions.length];
              const remaining = p ? g.questions.filter((q) => !p.seen.includes(q.id)).length : g.questions.length;
              return (
                <div
                  key={g.id}
                  className="glass reveal flex flex-col rounded-[20px] p-4 sm:rounded-[24px] sm:p-6"
                  style={{ ["--i" as string]: i + 1 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-extrabold tracking-tight text-white">{g.title}</h2>
                    <span className="flex-shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/70">全{g.questions.length}問</span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-white/60">{g.summary}</p>
                  <p className="mt-2 hidden rounded-xl bg-white/[0.05] px-3 py-2 text-[11.5px] sm:block leading-relaxed text-white/65">{g.point}</p>
                  <p className="mt-2 text-[11.5px] text-white/50">
                    {p ? `最高 ${p.best.score} / ${p.best.total}（${Math.round(rate(p.best) * 100)}%）　挑戦 ${p.plays}回　未出題 ${remaining}問` : "まだ挑戦していません"}
                  </p>
                  <div className="mt-2">
                    <p className="mb-1 text-[11px] font-bold text-white/45">何問にチャレンジしますか？</p>
                    <div className="flex flex-wrap gap-2">
                      {counts.map((n) => (
                        <button
                          key={n}
                          onClick={() => start(g, n)}
                          className="flex-1 rounded-xl bg-white px-4 py-2 text-[13px] font-bold text-black hover:bg-white/90"
                        >
                          {n === g.questions.length ? `全${n}問` : `${n}問`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-6 text-[11.5px] leading-relaxed text-white/40">
            問題は、学習用のものです。実際の相談では、相談者の語りを確認しながら、仮説として扱ってください。
          </p>
        </div>
      </main>
    );
  }

  /* ───────── 結果 ───────── */
  if (finished) {
    const score = results.filter((r) => r.ok).length;
    const total = run.questions.length;
    const wrong = results.filter((r) => !r.ok).map((r) => r.q);
    const ratio = rate_(score, total);
    const message = ratio === 1 ? "全問正解です。主訴と見立ての捉え方が、身についています。" : ratio >= 0.67 ? "よくできています。間違えた問題の考え方を、見直してみましょう。" : "考え方の手順を、もう一度、確認してみましょう。";
    return (
      <main className="screen-minh px-5 pb-10 pt-6 sm:px-8">
        <div className="mx-auto w-full max-w-[720px]">
          <div className="glass reveal rounded-[24px] p-7 text-center">
            <p className="text-[12px] font-bold text-white/50">{run.group.title}{run.review ? "（復習）" : ""}</p>
            <p className="mt-2 text-6xl font-extrabold text-white">
              {score}<span className="ml-1.5 text-2xl font-semibold text-white/45">/ {total}</span>
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-white/65">{message}</p>
          </div>

          <ul className="mt-3 space-y-1 sm:mt-4 sm:space-y-2">
            {results.map((r, i) => (
              <li key={i} className="flex items-start gap-3 rounded-2xl bg-white/[0.05] px-4 py-3">
                <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${r.ok ? "bg-[#5FD3A0]/20 text-[#7EE0B5]" : "bg-[#FF8A80]/20 text-[#FF8A80]"}`}>
                  {r.ok ? "○" : "×"}
                </span>
                <span className="text-[12.5px] leading-relaxed text-white/70">{r.q.scene.slice(0, 48)}…</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {wrong.length > 0 && (
              <button onClick={() => start(run.group, wrong.length, wrong)} className="flex-1 rounded-xl bg-white py-3.5 text-sm font-bold text-black hover:bg-white/90">
                間違えた{wrong.length}問を復習する
              </button>
            )}
            <button onClick={() => start(run.group, run.questions.length)} className={`flex-1 rounded-xl py-3.5 text-sm font-bold ${wrong.length > 0 ? "bg-white/10 text-white/85 hover:bg-white/15" : "bg-white text-black hover:bg-white/90"}`}>
              もう一度（新しい問題を優先します）
            </button>
            <button onClick={backToGroups} className="flex-1 rounded-xl bg-white/10 py-3.5 text-sm font-semibold text-white/85 hover:bg-white/15">
              グループ選択へ
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ───────── 出題 ───────── */
  const q = question!;
  const answered = picked !== null;
  const correct = answered && order[picked] === q.answer;
  const total = run.questions.length;

  return (
    <main className="screen-minh px-3.5 pb-8 pt-3 sm:px-8 sm:pt-5">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="flex items-center justify-between gap-3">
          <button onClick={backToGroups} className="text-[13px] font-semibold text-white/55 hover:text-white">← グループ選択</button>
          <span className="text-[13px] font-bold text-white/70">{run.group.title}{run.review ? "（復習）" : ""}　{idx + 1} / {total}</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500 transition-all duration-300" style={{ width: `${((idx + (answered ? 1 : 0)) / total) * 100}%` }} />
        </div>

        <section className="glass mt-3 rounded-[16px] p-3.5 sm:mt-4 sm:rounded-[22px] sm:p-6">
          <p className="text-[10px] font-bold tracking-wider text-white/45 sm:text-[11px]">相談者の語り</p>
          <p className="mt-1 text-[14.5px] leading-[1.7] text-white/90 sm:mt-2 sm:text-[14.5px] sm:leading-[1.9]"><span style={PHRASE_STYLE}>{phrased(q.scene)}</span></p>
        </section>

        <p className="mt-3.5 text-[14px] font-bold text-white sm:mt-5 sm:text-[15px]">{run.group.prompt}</p>

        <div className="mt-2 space-y-2.5 sm:mt-3 sm:space-y-2.5">
          {order.map((orig, pos) => {
            const isPicked = picked === pos;
            const isAnswer = orig === q.answer;
            let style = "bg-white/[0.06] hover:bg-white/10 text-white/85";
            if (answered) {
              if (isAnswer) style = "bg-[#5FD3A0]/15 text-white ring-2 ring-[#5FD3A0]";
              else if (isPicked) style = "bg-[#FF8A80]/15 text-white ring-2 ring-[#FF8A80]";
              else style = "bg-white/[0.04] text-white/45";
            }
            return (
              <button
                key={orig}
                onClick={() => choose(pos)}
                disabled={answered}
                aria-pressed={isPicked}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] leading-[1.6] transition-colors sm:gap-3 sm:px-4 sm:py-3.5 sm:text-[13.5px] sm:leading-[1.75] ${style} disabled:cursor-default`}
              >
                <span className={`mt-px flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold sm:mt-0.5 sm:h-6 sm:w-6 sm:text-[12px] ${answered && isAnswer ? "bg-[#5FD3A0] text-black" : answered && isPicked ? "bg-[#FF8A80] text-black" : "bg-white/15 text-white/80"}`}>
                  {LETTERS[pos]}
                </span>
                <span className="min-w-0 flex-1" style={PHRASE_STYLE}>{phrased(q.choices[orig])}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div ref={feedbackRef} className="mt-4 scroll-mt-14 space-y-3 sm:mt-6 sm:space-y-4">
            {/* ○× */}
            <div className={`reveal flex items-center gap-3 rounded-2xl px-4 py-2.5 sm:gap-4 sm:px-5 sm:py-4 ${correct ? "bg-[#5FD3A0]/12 ring-1 ring-[#5FD3A0]/40" : "bg-[#FF8A80]/12 ring-1 ring-[#FF8A80]/40"}`}>
              <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-2xl font-extrabold sm:h-14 sm:w-14 sm:text-4xl ${correct ? "bg-[#5FD3A0] text-black" : "bg-[#FF8A80] text-black"}`} aria-hidden>
                {correct ? "○" : "×"}
              </span>
              <div>
                <p className={`text-base font-extrabold sm:text-lg ${correct ? "text-[#7EE0B5]" : "text-[#FF8A80]"}`}>{correct ? "正解です" : "不正解です"}</p>
                {!correct && <p className="text-[12.5px] text-white/60">正解は、緑の選択肢です。</p>}
              </div>
            </div>

            {/* 考え方 */}
            <section className="glass reveal rounded-[18px] p-3.5 sm:rounded-[22px] sm:p-6" style={{ ["--i" as string]: 1 }}>
              <h3 className="text-[13.5px] font-extrabold text-white sm:text-[15px]">○を選ぶための考え方</h3>
              <ol className="mt-2 space-y-1.5 sm:mt-3 sm:space-y-2.5">
                {q.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-white/80 sm:gap-3 sm:text-[13.5px] sm:leading-[1.8]">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold text-white/85">{i + 1}</span>
                    <span style={PHRASE_STYLE}>{phrased(s)}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-3 rounded-xl bg-white/[0.05] px-3 py-2 sm:mt-4 sm:px-4 sm:py-3">
                <p className="text-[11px] font-bold text-white/50">ほかの選択肢が、適切でない理由</p>
                <p className="mt-0.5 text-[12.5px] leading-[1.5] text-white/75 sm:mt-1 sm:text-[13px] sm:leading-[1.8]"><span style={PHRASE_STYLE}>{phrased(q.whyNot)}</span></p>
              </div>
              {q.terms.length > 0 && (
                <dl className="mt-3 space-y-1 sm:mt-4 sm:space-y-2">
                  {q.terms.map((t) => (
                    <div key={t.term} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <dt className="rounded-md bg-pink-400/15 px-2 py-0.5 text-[12px] font-bold text-pink-200">{t.term}</dt>
                      <dd className="min-w-0 flex-1 text-[12.5px] leading-[1.45] text-white/65 sm:text-[12.5px] sm:leading-[1.75]"><span style={PHRASE_STYLE}>{phrased(t.meaning)}</span></dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>

            <button onClick={next} className="w-full rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-white/90 sm:py-3.5">
              {idx + 1 >= total ? "結果を見る" : "次の問題へ"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
