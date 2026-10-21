/* マイページの設定（ブラウザの localStorage に保存）。相談・練習の画面も、ここから読む */
export interface AppSettings {
  hint: boolean;           // 練習中のAIヒントを使う
  voice: boolean;          // 返答を音声で読み上げる
  voiceWait: VoiceWait;    // 音声入力で、話し終えたとみなす無音の長さ
}

/** 音声入力の無音の長さ（短め・ふつう・長め） */
export type VoiceWait = "short" | "normal" | "long";
export const VOICE_WAIT_OPTIONS: { value: VoiceWait; label: string; ms: number }[] = [
  { value: "short", label: "短め", ms: 1000 },
  { value: "normal", label: "ふつう", ms: 2000 },
  { value: "long", label: "長め", ms: 3000 },
];
export const voiceWaitMs = (v: VoiceWait) => VOICE_WAIT_OPTIONS.find((o) => o.value === v)?.ms ?? 2000;

const KEY = "mypageSettings";

export const DEFAULT_SETTINGS: AppSettings = {
  hint: true,
  voice: true,
  voiceWait: "normal",
};

export function getSettings(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      hint: typeof s.hint === "boolean" ? s.hint : DEFAULT_SETTINGS.hint,
      voice: typeof s.voice === "boolean" ? s.voice : DEFAULT_SETTINGS.voice,
      voiceWait: s.voiceWait === "short" || s.voiceWait === "long" ? s.voiceWait : "normal",
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
