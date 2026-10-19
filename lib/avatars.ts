/* シナリオ作成で選べる、相談者の見た目（画像）。表情ごとの画像がある */
export interface AvatarOption {
  id: string;
  name: string;
  src: string; // 一覧・選択画面に出す、通常の表情
  voicePrefs: string[]; // VOICEVOXの声（優先順位順）
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "HINA", name: "HINA", src: "/characters/HINA.webp", voicePrefs: ["東北ずん子", "東北イタコ", "東北きりたん"] },
  { id: "MIKA", name: "MIKA", src: "/characters/MIKA.webp", voicePrefs: ["夜語トバリ"] },
  { id: "HARU", name: "HARU", src: "/characters/HARU.webp", voicePrefs: ["ユーレイちゃん"] },
];

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0].id;

export function avatarSrc(id?: string): string | null {
  return AVATAR_OPTIONS.find((a) => a.id === id)?.src ?? null;
}

export function avatarVoicePrefs(id?: string): string[] {
  return AVATAR_OPTIONS.find((a) => a.id === id)?.voicePrefs ?? [];
}

export function isAvatarId(id?: string): id is string {
  return !!id && AVATAR_OPTIONS.some((a) => a.id === id);
}

/** 表情の名前 → 画像。ない表情は、近いものにそろえる */
export function avatarEmotionMap(id: string): Record<string, string> {
  const f = (e: string) => `/characters/${id}_${e}.webp`;
  return {
    idle: `/characters/${id}.webp`,
    neutral: f("neutral"),
    smile: f("smile"),
    happy: f("happy"),
    worried: f("worried"),
    sad: f("sad"),
    surprised: f("surprised"),
    angry: f("angry"),
    serious: f("neutral"),
    smirk: f("smile"),
    warm: f("smile"),
  };
}
