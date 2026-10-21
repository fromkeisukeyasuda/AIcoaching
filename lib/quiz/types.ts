/* 1問1答クイズのデータ構造。グループごとにファイルを分けて、あとから増やせる */
export interface QuizTerm {
  term: string;      // 専門用語
  meaning: string;   // かんたんな意味
}

export interface QuizQuestion {
  id: string;
  scene: string;       // 相談者の語り・状況（問題文）
  choices: string[];   // 選択肢（4つ）。表示のたびに、並びを入れ替える
  answer: number;      // 正解の選択肢の番号（choices の中の位置）
  steps: string[];     // 正解にたどりつく考え方（手順）
  whyNot: string;      // ほかの選択肢が、適切でない理由
  terms: QuizTerm[];   // 解説に出てくる専門用語
}

export interface QuizGroup {
  id: string;
  title: string;        // グループ名（例: 主訴を見抜く）
  summary: string;      // 一言の説明
  point: string;        // このグループで身につけたい考え方
  prompt: string;       // 問いかけ（各問題の上に表示）
  questions: QuizQuestion[];
}
