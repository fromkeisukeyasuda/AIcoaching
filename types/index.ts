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

export interface EvaluationResult {
  overallScore: number;
  summary: string;
  scores: EvaluationScore[];
  strengths: string[];
  improvements: string[];
  nextSteps: string;
}

export interface SessionData {
  scenario: Scenario;
  messages: Message[];
  startedAt: string;
  endedAt: string;
}
