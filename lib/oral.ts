import { OralKey } from "@/types";

/* 口頭試問（面接官）。設問は、振り返りシートの口頭試問と同じ5項目 */
export interface OralQuestion {
  key: OralKey;
  n: string;        // ①〜⑤
  title: string;    // 項目名（振り返りシートと同じ）
  hint: string;     // 振り返りシートと同じ補足
  text: string;     // 面接官が読み上げる質問
}

export const ORAL_QUESTIONS: OralQuestion[] = [
  { key: "done", n: "①", title: "できたこと", hint: "CCの具体的介入 → クライエントの気づき",
    text: "今回の面談で、できたことを教えてください。あなたが行った関わりと、それによる相談者の気づきを、具体的にお話しください。" },
  { key: "improve", n: "②", title: "改善点", hint: "やり残した点・もう一歩寄り添えた感情",
    text: "改善点を教えてください。やり残したことや、もう一歩、寄り添えた相談者の感情はありましたか。" },
  { key: "complaint", n: "③", title: "主訴", hint: "客観的事実＋主観的苦悩・葛藤",
    text: "相談者の主訴を、説明してください。客観的な事実と、主観的な苦悩や葛藤を、分けてお話しください。" },
  { key: "view", n: "④", title: "見立て", hint: "心理的課題・自己概念の歪み",
    text: "相談者への、あなたの見立てを教えてください。心理的な課題や、自己概念の揺らぎを、どのように捉えましたか。" },
  { key: "plan", n: "⑤", title: "今後の面談方針", hint: "次回以降の具体的支援（スモールステップ）",
    text: "今後の面談方針を教えてください。次回以降の具体的な支援を、小さなステップでお話しください。" },
];

/** 面接官が読み上げる、質問の文（最初・最後の質問であることを添える） */
export function spokenQuestion(i: number): string {
  const lead = i === 0 ? "最初の質問です。" : i === ORAL_QUESTIONS.length - 1 ? "最後の質問です。" : "次の質問です。";
  return lead + ORAL_QUESTIONS[i].text;
}

export const ORAL_INTRO =
  "これから、口頭試問を始めます。今回の面談について、5つの質問をします。落ち着いて、お答えください。";
export const ORAL_OUTRO = "以上で、口頭試問を終わります。お疲れさまでした。評価をまとめますので、少しお待ちください。";

/** 面接官の見た目と声 */
export const INTERVIEWER_IMAGE = "/characters/interviewer.webp";
export const INTERVIEWER_VOICE_PREFS = ["中部つるぎ"];
export const INTERVIEWER_NAME = "面接官";

/** 評価の観点（項目ごと）。面接官（AI）への指示に使う */
export const ORAL_RUBRIC: Record<OralKey, string> = {
  done: "CCの具体的な介入（問い・傾聴・要約など）と、それによる相談者の気づきを、因果としてつなげて、会話の事実に沿って説明できているか",
  improve: "やり残した点や、もう一歩寄り添えた相談者の感情を、具体的に自己認識できているか。次に何をしたいかまで、言えているか",
  complaint: "相談者の主訴を、客観的な事実と、主観的な苦悩・葛藤に分けて、会話の内容に基づいて説明できているか",
  view: "心理的な課題や、自己概念の揺らぎ（役割への過剰適応など）を、会話の事実を根拠に、専門的な視点で説明できているか。決めつけていないか",
  plan: "次回以降の支援が、スモールステップで具体的か。見立てや主訴と、一貫しているか",
};
