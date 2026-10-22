/* チュートリアル（佐藤 美咲さん・第1回）。1本道のコースで、途中の状態を localStorage に保存する */

export type TutorialStep = "welcome" | "model" | "quiz" | "practice" | "result" | "done";

export const TUTORIAL_STEPS: { key: TutorialStep; label: string }[] = [
  { key: "welcome", label: "はじめに" },
  { key: "model", label: "面談の型" },
  { key: "quiz", label: "主訴クイズ" },
  { key: "practice", label: "面談" },
  { key: "result", label: "結果" },
];

export const TUTORIAL_SCENARIO_ID = "career-change";   // 佐藤 美咲さん
export const TUTORIAL_ORAL_QUESTIONS = 2;              // チュートリアルの口頭試問は、短く2問
export const TUTORIAL_QUIZ_COUNT = 3;                  // 主訴クイズは3問

/** 面談の中で、1つずつ出すミッション。あなたが1回話すたびに、次へ進む（例は、そのまま使える言い方） */
export const MISSIONS = [
  { title: "受けとめる", detail: "相談者の言葉を、そのまま返して、受けとめましょう。", example: "「今の仕事に、モヤモヤしているのですね」" },
  { title: "気持ちを聴く", detail: "「どんなところが」「どのように」で、気持ちや背景を聴きましょう。", example: "「どんなところに、一番モヤモヤしますか」" },
  { title: "小さな一歩で終える", detail: "話を短くまとめて、今日からできる小さな一歩を、一緒に決めましょう。", example: "「ここまでをまとめると…。まず、何から始められそうですか」" },
];

export interface TutorialProgress {
  step: TutorialStep;
  mission: number;         // 面談中のミッション（0から）
  session?: string;        // チュートリアルの面談の ID（開始時刻）。評価のあと、結果の画面へ進めるために使う
}

const KEY = "tutorialProgress";
const DEFAULT: TutorialProgress = { step: "welcome", mission: 0 };
const STEP_KEYS: string[] = [...TUTORIAL_STEPS.map((s) => s.key), "done"];

export function getTutorial(): TutorialProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (raw && STEP_KEYS.includes(raw.step)) {
      return { step: raw.step, mission: Number.isInteger(raw.mission) ? raw.mission : 0, session: typeof raw.session === "string" ? raw.session : undefined };
    }
  } catch { /* 読めなければ、最初から */ }
  return { ...DEFAULT };
}

export function saveTutorial(patch: Partial<TutorialProgress>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getTutorial(), ...patch }));
  } catch { /* 保存できなくても、進められる */ }
}

export const isTutorialDone = () => getTutorial().step === "done";
