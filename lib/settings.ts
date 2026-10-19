/* マイページの設定（ブラウザの localStorage に保存）。相談・練習の画面も、ここから読む */
export interface AppSettings {
  hint: boolean;           // 練習中のAIヒントを使う
  voice: boolean;          // 返答を音声で読み上げる
}

const KEY = "mypageSettings";

export const DEFAULT_SETTINGS: AppSettings = {
  hint: true,
  voice: true,
};

export function getSettings(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      hint: typeof s.hint === "boolean" ? s.hint : DEFAULT_SETTINGS.hint,
      voice: typeof s.voice === "boolean" ? s.voice : DEFAULT_SETTINGS.voice,
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
