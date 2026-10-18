import { ReflectionSheet, Scenario } from "@/types";

export const SHEET_PHASE_NAMES = [
  "導入・防衛解除",
  "表層の課題把握（役割・行動層）",
  "存在層へのアクセス（価値観）",
  "自己矛盾・死角の直面化",
  "自己受容・あり方の統合",
] as const;

/** プロンプトに差し込む「振り返りシート」の作成指示 */
export function sheetInstructions(scenario: Scenario): string {
  return `
【振り返りシートの作成】
会話を、キャリアコンサルティングの実技試験対策の観点で振り返るシートにまとめてください。コーチ（ユーザー）の発言を「CC」と呼びます。

- 三層モデル: 役割層（べき論・他者評価・鎧）／行動層（不満や葛藤が生じている業務内容・時間・成果）／存在層（本来の原動力・コアの価値観・願い）
- 面談プロセス分析は、次の5フェーズを必ずこの順で書く: ${SHEET_PHASE_NAMES.join(" / ")}
  各フェーズに、クライエントの状態・発言の要点 / CCの意図的な関わり・発問 / 変化・内省の深化度 を、会話に実際にあった内容だけで簡潔に書く。会話で行われていないフェーズは、client と cc を "—"、change を "未実施" とする。
- 口頭試問の4問（主訴／CC視点の見立て／できたこと／改善点・今後の方針）が、一つのストーリーとして整合するように書く。
  主訴は「客観的事実＋主観的苦悩・葛藤」、見立ては自己概念の揺らぎや役割過剰適応などの心理的課題、できたことは「CCの介入→クライエントの気づき」の因果で書く。
  改善点（improve）はどの感情にもう一歩丁寧に寄り添えたか、今後の方針（plan）はスモールステップの行動変容で書く。
- キークエスチョン: 実際の会話で、クライエントの視座を動かした可能性が高いCCの問いを最大3つ。 question は会話の発言を、そのまま抜粋する（60文字以内）。
- 事実の裏づけがないことは書かない。クライエントの背景は「${scenario.clientName}（${scenario.clientRole}）／${scenario.description}」を参考にする。
`;
}

export const SHEET_JSON_EXAMPLE = `{
    "situation": "相談場面・導入状況（例：定期面談、初対面、警戒あり）",
    "layers": { "role": "囚われていた役割層", "action": "葛藤が生じている行動層", "being": "本来の原動力（存在層）" },
    "phases": [
      { "phase": "導入・防衛解除", "client": "クライエントの状態・発言の要点", "cc": "CCの関わり・発問", "change": "変化・内省の深まり" },
      { "phase": "表層の課題把握（役割・行動層）", "client": "…", "cc": "…", "change": "…" },
      { "phase": "存在層へのアクセス（価値観）", "client": "…", "cc": "…", "change": "…" },
      { "phase": "自己矛盾・死角の直面化", "client": "…", "cc": "…", "change": "…" },
      { "phase": "自己受容・あり方の統合", "client": "…", "cc": "…", "change": "…" }
    ],
    "oral": {
      "complaint": "主訴（客観的事実＋主観的苦悩・葛藤）",
      "view": "CC視点の見立て（心理的課題・自己概念）",
      "done": "できたこと（介入→気づき）",
      "improve": "やり残した点・改善点",
      "plan": "次回以降の具体的支援（スモールステップ）"
    },
    "consistency": "4問がひとつの筋として整合しているかの所見（1〜2文）",
    "keyQuestions": [ { "label": "存在層の抽出", "question": "会話から抜粋したCCの問い", "effect": "その問いで起きた変化" } ],
    "nextTheme": "次回に持ち越す実践テーマ（1文）"
  }`;

const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);

/** AIの出力を、画面で安全に使える形に整える */
export function normalizeSheet(raw: unknown): ReflectionSheet | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const phases = Array.isArray(r.phases) ? r.phases : [];
  const normPhases = SHEET_PHASE_NAMES.map((name, i) => {
    const p = phases.find((x: any) => x && x.phase === name) ?? phases[i] ?? {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    return { phase: name as string, client: str(p.client, "—"), cc: str(p.cc, "—"), change: str(p.change, "未実施") };
  });
  const o = r.oral ?? {};
  return {
    situation: str(r.situation),
    layers: { role: str(r.layers?.role), action: str(r.layers?.action), being: str(r.layers?.being) },
    phases: normPhases,
    oral: { complaint: str(o.complaint), view: str(o.view), done: str(o.done), improve: str(o.improve), plan: str(o.plan) },
    consistency: str(r.consistency),
    keyQuestions: (Array.isArray(r.keyQuestions) ? r.keyQuestions : [])
      .slice(0, 3)
      .map((k: any) => ({ label: str(k?.label), question: str(k?.question), effect: str(k?.effect) })) // eslint-disable-line @typescript-eslint/no-explicit-any
      .filter((k: { question: string }) => k.question),
    nextTheme: str(r.nextTheme),
  };
}
