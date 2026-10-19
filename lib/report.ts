import { EvaluationResult, SessionData } from "@/types";

/** 評価結果を、Markdownのレポートにまとめる */
export function buildReport(session: SessionData, result: EvaluationResult, dateStr: string): string {
  const L: string[] = [];
  L.push(`# 練習レポート ${dateStr}`, "");
  L.push(`- 相談者: ${session.scenario.clientName}（${session.scenario.clientRole}）`);
  L.push(`- テーマ: ${session.scenario.title}`);
  L.push(`- 総合スコア: ${result.overallScore} / 100`, "");
  L.push("## 総評", "", result.summary, "");
  L.push("## 項目別スコア", "");
  for (const s of result.scores) L.push(`- ${s.category}: ${s.score} / ${s.maxScore} — ${s.feedback}`);
  L.push("", "## 良かった点", "");
  for (const t of result.strengths) L.push(`- ${t}`);
  L.push("", "## 改善点", "");
  for (const t of result.improvements) L.push(`- ${t}`);
  if (result.previousImprovementsReview?.length) {
    L.push("", "## 前回の改善点の振り返り", "");
    for (const r of result.previousImprovementsReview) L.push(`- ${r.addressed ? "達成" : "未達"}: ${r.item} — ${r.comment}`);
  }
  L.push("", "## 次回に向けて", "", result.nextSteps, "");
  L.push("## 会話ログ", "");
  for (const m of session.messages) L.push(`**${m.role === "user" ? "あなた" : session.scenario.clientName}**: ${m.content}`, "");
  return L.join("\n");
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
