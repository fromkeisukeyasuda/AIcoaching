export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Scenario {
  id: string;
  title: string;
  clientName: string;
  clientRole: string;
  situation: string;
  emotion: string;
  description: string;
  tags: string[];
  icon: string;
  isCustom?: boolean;
}

export interface EvaluationScore {
  category: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface ImprovementReview {
  item: string;       // 前回の改善点テキスト
  addressed: boolean; // 今回のセッションで対応できたか
  comment: string;    // AIによるコメント
}

export interface EvaluationResult {
  overallScore: number;
  summary: string;
  scores: EvaluationScore[];
  strengths: string[];
  improvements: string[];
  nextSteps: string;
  previousImprovementsReview?: ImprovementReview[];
}

export interface SessionData {
  scenario: Scenario;
  messages: Message[];
  startedAt: string;
  endedAt: string;
}

export interface SessionRecord {
  id: string;          // = session.startedAt（セッション一意キー）
  session: SessionData;
  evaluation: EvaluationResult;
  savedAt: string;
}
