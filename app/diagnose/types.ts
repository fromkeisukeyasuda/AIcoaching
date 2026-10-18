// 設問
export interface Question {
  id: number;
  text: string;
  scale?: { min: string; max: string }; // 5段階の場合
  options?: string[]; // 選択肢の場合
}

// 回答
export interface Answer {
  questionId: number;
  value: number; // 1-5
}

// 6タイプ
export type SilenceType =
  | "meaning"   // 意味の沈黙
  | "relation"  // 関係の沈黙
  | "time"      // 時間の沈黙
  | "existence" // 存在の沈黙
  | "limit"     // 限界の沈黙
  | "awakening" // 覚醒の沈黙

// タイプ情報
export interface TypeInfo {
  type: SilenceType;
  name: string;        // 例: 「存在の沈黙」
  essence: string;     // 1行の本質説明
  poem: string;        // 詩的な描写（3〜4行）
  question: string;    // 渡す問い（太字で表示するメインの問い）
  cta: string;         // Vision Retreat Coachingへの接続文言
  shareText: string;   // SNSシェアのテンプレート文
  color: string;       // テーマカラー（hex）
  bgGradient: string;  // 背景グラデーション
}

// 診断結果
export interface DiagnosisResult {
  type: SilenceType;
  totalScore: number;
  answers: Answer[];
}
