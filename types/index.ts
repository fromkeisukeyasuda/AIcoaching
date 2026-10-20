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
  avatar?: string;   // 作成時に選んだ見た目（lib/avatars.ts の id）
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

/** 面談プロセス分析（三層モデルの推移）の1フェーズ */
export interface SheetPhase {
  phase: string;   // 導入・防衛解除 など
  client: string;  // クライエントの状態・発言の要点
  cc: string;      // CCの意図的な関わり・発問
  change: string;  // 変化・内省の深化度
}

/** ロールプレイ振り返りシート（AIが会話から作成する部分） */
export interface ReflectionSheet {
  situation: string;                               // 相談場面・導入状況
  layers: { role: string; action: string; being: string }; // 役割層・行動層・存在層
  phases: SheetPhase[];                            // A. 面談プロセス分析
  oral: {                                          // B. 口頭試問 整合性マトリクス
    done: string;       // ① できたこと
    improve: string;    // ② 改善点
    complaint: string;  // ③ 主訴
    view: string;       // ④ 見立て
    plan: string;       // ⑤ 今後の面談方針
  };
  consistency: string;                             // 5問の整合性コメント
  keyQuestions: { label: string; question: string; effect: string }[]; // C. キークエスチョン
  nextTheme: string;                               // D. 次回へ持ち越す実践テーマ（AI案）
}

/** シートのうち、本人が入力する部分（自己採点・テーマ・メモ） */
export interface ReflectionNotes {
  selfScore?: number;
  targetScore?: number;
  nextTheme?: string;
  memo?: string;
}

export interface EvaluationResult {
  overallScore: number;
  summary: string;
  scores: EvaluationScore[];
  strengths: string[];
  improvements: string[];
  nextSteps: string;
  previousImprovementsReview?: ImprovementReview[];
  sheet?: ReflectionSheet;
}

export interface SessionData {
  scenario: Scenario;
  messages: Message[];
  startedAt: string;
  endedAt: string;
}

/** コーチ（ユーザー）の発言1つぶんの評価 */
export interface UtteranceFeedback {
  index: number;      // session.messages 内の位置
  score: number;      // 0-100
  headline: string;   // 発言への総評（1〜2文）
  goods: { title: string; body: string }[];     // 良かった点
  improves: { title: string; body: string }[];  // さらに完成度を高めるためのポイント
}

export interface SessionRecord {
  id: string;          // = session.startedAt（セッション一意キー）
  session: SessionData;
  evaluation: EvaluationResult;
  savedAt: string;
  reflection?: ReflectionNotes;
  utterances?: UtteranceFeedback[];
  oral?: OralResult;            // 口頭試問と面接官評価（受けた場合）
}

/** 口頭試問の項目（振り返りシートの口頭試問と同じ5項目） */
export type OralKey = "done" | "improve" | "complaint" | "view" | "plan";

/** 口頭試問の、1問ぶんの結果（質問・あなたの答え・面接官の採点と講評） */
export interface OralItem {
  key: OralKey;
  question: string;
  answer: string;
  score?: number;      // 0-100。評価を作れなかったときは、なし
  headline?: string;   // 面接官の一言
  good?: string;       // 良かった点
  improve?: string;    // 補うとよい点
}

/** 口頭試問と面接官評価の全体 */
export interface OralResult {
  items: OralItem[];
  overall: number;          // 総合点（各問の平均）
  summary: string;          // 面接官の総評
  strengths: string[];
  improvements: string[];
  consistency: string;      // 5問がひとつの筋として整合しているかの所見
}
