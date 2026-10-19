import { clients, coaches } from "@/lib/coaches";

/** VOICEVOXのキャラクターの声を使うときの、クレジット表記（例: VOICEVOX:四国めたん） */
export function voiceCredit(speakerName: string): string {
  return `VOICEVOX:${speakerName}`;
}

/** アプリで使っている声（各キャラの第1候補）の一覧。マイページのクレジット欄に出す */
export function usedVoiceNames(): string[] {
  const names = [...coaches, ...clients].map((c) => c.voicePrefs[0]).filter(Boolean);
  return Array.from(new Set(names));
}

export const VOICEVOX_SITE = "https://voicevox.hiroshiba.jp/";
