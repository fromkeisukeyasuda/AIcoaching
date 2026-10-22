/* マイページの設定（ブラウザの localStorage に保存）。相談・練習の画面も、ここから読む */
export interface AppSettings {
  hint: boolean;           // 練習中のAIヒントを使う
  voice: boolean;          // 返答を音声で読み上げる
  voiceWait: VoiceWait;    // 音声入力で、話し終えたとみなす無音の長さ
  historyView: HistoryView; // ふりかえりの表示（basic: 基本情報と面接官評価だけ / standard: すべて）
}

export type HistoryView = "basic" | "standard";

/** プラン。いまは、ふりかえりの右上の切り替え（Free / Pro）が、そのまま、プランになる（決済は、まだない） */
export type Plan = "free" | "pro";
export const planOf = (v: HistoryView): Plan => (v === "standard" ? "pro" : "free");

/** 音声入力の無音の長さ（短め・ふつう・長め） */
export type VoiceWait = "short" | "normal" | "long" | "manual";
export const VOICE_WAIT_OPTIONS: { value: VoiceWait; label: string; sub: string; ms: number }[] = [
  { value: "short", label: "短め", sub: "1.0秒", ms: 1000 },
  { value: "normal", label: "ふつう", sub: "2.0秒", ms: 2000 },
  { value: "long", label: "長め", sub: "3.0秒", ms: 3000 },
  { value: "manual", label: "無制限", sub: "送信ボタンで送る", ms: 0 },   // 無音で送らず、送信ボタンを押すまで聞き続ける
];
export const voiceWaitMs = (v: VoiceWait) => VOICE_WAIT_OPTIONS.find((o) => o.value === v)?.ms ?? 2000;

const KEY = "mypageSettings";

export const DEFAULT_SETTINGS: AppSettings = {
  hint: true,
  voice: true,
  voiceWait: "normal",
  historyView: "standard",   // 初期状態は Pro（お試し期間）
};

export function getSettings(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      hint: typeof s.hint === "boolean" ? s.hint : DEFAULT_SETTINGS.hint,
      voice: typeof s.voice === "boolean" ? s.voice : DEFAULT_SETTINGS.voice,
      historyView: s.historyView === "basic" ? "basic" : "standard",
      voiceWait: s.voiceWait === "short" || s.voiceWait === "long" || s.voiceWait === "manual" ? s.voiceWait : "normal",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(patch: Partial<AppSettings>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...patch }));
  } catch { /* 保存できなくても、画面の動作は続ける */ }
}
