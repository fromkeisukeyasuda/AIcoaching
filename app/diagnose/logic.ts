import type { Answer, SilenceType, DiagnosisResult } from "./types";
import { TYPE_INFO } from "./data";

// 各設問がどのタイプと関連するかのマッピング
// questionId: 1-10
export const QUESTION_TYPE_MAP: Record<number, SilenceType> = {
  1: "meaning",    // 仕事の意味・目的への問い
  2: "relation",   // 人間関係・誰のためかへの問い
  3: "time",       // 時間の使い方・いつまでかへの問い
  4: "existence",  // 肩書き・自己同一性への問い
  5: "limit",      // 疲弊・限界への問い
  6: "awakening",  // 変化・手放しへの問い
  7: "meaning",    // 意味タイプの補完設問
  8: "relation",   // 関係タイプの補完設問
  9: "time",       // 時間タイプの補完設問
  10: "existence", // 存在タイプの補完設問
};

// タイプごとのスコアを集計
export function calcTypeScores(answers: Answer[]): Record<SilenceType, number> {
  const scores: Record<SilenceType, number> = {
    meaning: 0,
    relation: 0,
    time: 0,
    existence: 0,
    limit: 0,
    awakening: 0,
  };

  for (const answer of answers) {
    const type = QUESTION_TYPE_MAP[answer.questionId];
    if (type) {
      scores[type] += answer.value;
    }
  }

  return scores;
}

// 最も高いスコアのタイプを返す（同点の場合は最初に見つかったもの）
export function determineType(scores: Record<SilenceType, number>): SilenceType {
  let maxType: SilenceType = "meaning";
  let maxScore = -1;

  for (const [type, score] of Object.entries(scores) as [SilenceType, number][]) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type;
    }
  }

  return maxType;
}

// メインの診断関数
export function diagnose(answers: Answer[]): DiagnosisResult {
  const scores = calcTypeScores(answers);
  const type = determineType(scores);
  const totalScore = answers.reduce((sum, a) => sum + a.value, 0);

  return {
    type,
    totalScore,
    answers,
  };
}

// タイプ情報を取得するヘルパー
export function getTypeInfo(type: SilenceType) {
  return TYPE_INFO[type];
}
