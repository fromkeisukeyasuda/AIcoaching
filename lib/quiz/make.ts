import { QuizQuestion } from "./types";

/** 問題を、短く書くための補助。
   choices は、[正解, 誤答1, 誤答2, 誤答3] の順で書く（正解の位置は、ここで、問題ごとにばらす。表示のときは、さらに入れ替える） */
export function mk(
  id: string,
  scene: string,
  choices: [string, string, string, string],
  steps: [string, string, string],
  whyNot: string,
  terms: [string, string][]
): QuizQuestion {
  const n = Number(id.split("-")[1]) || 0;
  const pos = (n * 3 + 1) % 4;
  const arranged = choices.slice(1);
  arranged.splice(pos, 0, choices[0]);
  return {
    id,
    scene,
    choices: arranged,
    answer: pos,
    steps,
    whyNot,
    terms: terms.map(([term, meaning]) => ({ term, meaning })),
  };
}
