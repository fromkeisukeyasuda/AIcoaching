import { SessionRecord } from "@/types";

/* 面談スキルの診断。練習後の評価・口頭試問の採点・クイズの正答率を、6つのスキル（0〜100）にまとめる。
   会話の内容は使わない（端末内の、点数だけで計算する） */

export type SkillKey = "listening" | "empathy" | "question" | "complaint" | "assessment" | "support";

export interface SkillAxis {
  key: SkillKey;
  label: string;
  value: number | null;      // 今回（最新の記録）。測定できていないときは null
  average: number | null;    // これまでの平均（最新を除く）
  source: "評価" | "口頭試問" | "クイズ" | null;
}

export interface SkillAdvice {
  key: SkillKey;
  label: string;
  tip: string;
  cta: { label: string; href: string };
}

const SKILLS: { key: SkillKey; label: string }[] = [
  { key: "listening", label: "傾聴" },
  { key: "empathy", label: "共感" },
  { key: "question", label: "質問" },
  { key: "complaint", label: "主訴把握" },
  { key: "assessment", label: "見立て" },
  { key: "support", label: "支援・方針" },
];

const ADVICE: Record<SkillKey, Omit<SkillAdvice, "key" | "label">> = {
  listening: { tip: "相手の言葉をそのまま返したり、短く要約したりしてから、次の問いに進む練習をしましょう。", cta: { label: "面談を練習する", href: "/session" } },
  empathy: { tip: "出来事だけでなく、そのときの気持ちの言葉を拾って返す練習をしましょう。", cta: { label: "面談を練習する", href: "/session" } },
  question: { tip: "「どんなところが一番気になりますか」のような、答えを広げる問いを増やしてみましょう。", cta: { label: "面談を練習する", href: "/session" } },
  complaint: { tip: "客観的な事実と、主観的な苦悩を分けて捉える練習が、効果的です。クイズで、型を確認しましょう。", cta: { label: "「主訴を見抜く」に挑戦", href: "/quiz" } },
  assessment: { tip: "語りの根拠から、心理的な課題を仮説として立てる練習が、効果的です。クイズで、考え方を確認しましょう。", cta: { label: "「見立てを考える」に挑戦", href: "/quiz" } },
  support: { tip: "面談の終盤で、小さな一歩を一緒に決めて終える練習をしましょう。", cta: { label: "面談を練習する", href: "/session" } },
};

/** ホームに出す、今日のチャレンジ（練習の前に、意識することを一言で決める） */
export interface Challenge {
  label: string;          // 「質問」など
  title: string;          // 一言
  value: number | null;   // いまの目安（点）
}

const CHALLENGES: Record<SkillKey, string> = {
  listening: "相手の言葉を、そのまま返す",
  empathy: "気持ちの言葉を拾う",
  question: "開いた問いを使う",
  complaint: "事実と感情を分けて聴く",
  assessment: "語りから仮説を持つ",
  support: "小さな一歩で終える",
};

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** 評価のカテゴリ名の、ゆれに耐えるよう、含まれる語で振り分ける */
function fromEvaluation(r: SessionRecord): Partial<Record<SkillKey, number>> {
  const pick = (re: RegExp) => {
    const hits = r.evaluation.scores.filter((s) => re.test(s.category) && s.maxScore > 0);
    return avg(hits.map((s) => (s.score / s.maxScore) * 100));
  };
  const out: Partial<Record<SkillKey, number>> = {};
  const l = pick(/傾聴/), e = pick(/共感/), q = pick(/質問/), s = pick(/目標|アクション|行動|支援/);
  if (l !== null) out.listening = l;
  if (e !== null) out.empathy = e;
  if (q !== null) out.question = q;
  if (s !== null) out.support = s;
  return out;
}

function fromOral(r: SessionRecord): Partial<Record<SkillKey, number>> {
  const out: Partial<Record<SkillKey, number>> = {};
  const score = (key: string) => r.oral?.items.find((i) => i.key === key)?.score;
  const c = score("complaint"), v = score("view");
  if (typeof c === "number") out.complaint = c;
  if (typeof v === "number") out.assessment = v;
  return out;
}

/** クイズの、最後の挑戦の正答率（口頭試問がない人の、主訴・見立ての目安） */
function fromQuiz(): Partial<Record<SkillKey, number>> {
  const out: Partial<Record<SkillKey, number>> = {};
  try {
    const raw = JSON.parse(localStorage.getItem("quizProgress") ?? "{}") as Record<string, { last?: { score: number; total: number } }>;
    const rate = (id: string) => {
      const l = raw[id]?.last;
      return l && l.total > 0 ? Math.round((l.score / l.total) * 100) : null;
    };
    const c = rate("complaint"), a = rate("assessment");
    if (c !== null) out.complaint = c;
    if (a !== null) out.assessment = a;
  } catch { /* 読めなければ、なし */ }
  return out;
}

/** records は新しい順。最新の記録を「今回」、それ以前の平均を「これまで」とする */
export function computeSkills(records: SessionRecord[]): { axes: SkillAxis[]; advice: SkillAdvice | null; hint: string | null } {
  const perRecord = records.map((r) => ({ ...fromOral(r), ...fromEvaluation(r) }));
  const quiz = fromQuiz();

  const axes: SkillAxis[] = SKILLS.map(({ key, label }) => {
    // 今回: 最新の記録にあればそれ。なければ、直近の記録（口頭試問は毎回受けるとは限らない）。それもなければ、クイズ
    const idx = perRecord.findIndex((p) => typeof p[key] === "number");
    let value: number | null = null;
    let source: SkillAxis["source"] = null;
    if (idx >= 0) {
      value = perRecord[idx][key]!;
      source = key === "complaint" || key === "assessment" ? "口頭試問" : "評価";
    } else if (typeof quiz[key] === "number") {
      value = quiz[key]!;
      source = "クイズ";
    }
    const earlier = idx >= 0 ? perRecord.slice(idx + 1).map((p) => p[key]).filter((x): x is number => typeof x === "number") : [];
    return { key, label, value, average: avg(earlier), source };
  });

  const measured = axes.filter((a) => a.value !== null) as (SkillAxis & { value: number })[];
  let advice: SkillAdvice | null = null;
  if (measured.length > 0) {
    const weakest = measured.reduce((m, a) => (a.value < m.value ? a : m));
    const base = ADVICE[weakest.key];
    // 次回のチャレンジ: クイズで学ぶスキルは、そのクイズへ。面談で磨くスキルは、そのチャレンジを意識した面談へ
    const cta = base.cta.href === "/quiz" ? base.cta : { label: `面談で「${CHALLENGES[weakest.key]}」に挑戦`, href: "/session" };
    advice = { key: weakest.key, label: weakest.label, ...base, cta };
  }
  const unmeasured = axes.filter((a) => a.value === null).map((a) => a.label);
  const hint = unmeasured.length > 0
    ? `${unmeasured.join("・")}は、まだ測定できていません。${unmeasured.some((l) => l === "主訴把握" || l === "見立て") ? "口頭試問を受けるか、クイズに挑戦すると、測定されます。" : "練習を重ねると、測定されます。"}`
    : null;
  return { axes, advice, hint };
}

/** いま一番伸ばしたいスキルから、今日のチャレンジを決める。記録がなければ、最初の面談を勧める */
export function getChallenge(records: SessionRecord[]): Challenge {
  const { advice, axes } = computeSkills(records);
  if (!advice) return { label: "はじめの一歩", title: "まずは1回、面談してみる", value: null };
  const value = axes.find((a) => a.key === advice.key)?.value ?? null;
  return { label: advice.label, title: CHALLENGES[advice.key], value };
}

/** 総合スキルの目標（合格の目安）。6つのスキルの平均点で見る */
export const SKILL_TARGET = 80;

/** 総合スキル（測定できているスキルの平均）。まだ測定がなければ null */
export function getOverall(records: SessionRecord[]): number | null {
  const v = computeSkills(records).axes.map((a) => a.value).filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
