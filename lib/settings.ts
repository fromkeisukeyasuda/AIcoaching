/* マイページの設定（ブラウザの localStorage に保存）。相談・練習の画面も、ここから読む */
export interface AppSettings {
  freq: string;
  hint: boolean;           // 練習中のAIヒントを使う
  voice: boolean;          // 返答を音声で読み上げる
  favoriteThemes: string[];
}

const KEY = "mypageSettings";

export const DEFAULT_SETTINGS: AppSettings = {
  freq: "週1回",
  hint: true,
  voice: true,
  favoriteThemes: ["マネジメント", "傾聴", "目標設定"],
};

export function getSettings(): AppSettings {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return {
      freq: typeof s.freq === "string" ? s.freq : DEFAULT_SETTINGS.freq,
      hint: typeof s.hint === "boolean" ? s.hint : DEFAULT_SETTINGS.hint,
      voice: typeof s.voice === "boolean" ? s.voice : DEFAULT_SETTINGS.voice,
      favoriteThemes: Array.isArray(s.favoriteThemes) ? s.favoriteThemes : DEFAULT_SETTINGS.favoriteThemes,
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
