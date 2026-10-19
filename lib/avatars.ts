/* シナリオ作成で選べる、相談者の見た目（画像）。表情の差分はなく、1枚をそのまま使う */
export interface AvatarOption {
  id: string;
  name: string;
  src: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: "HINA", name: "HINA", src: "/characters/HINA.webp" },
  { id: "MIKA", name: "MIKA", src: "/characters/MIKA.webp" },
  { id: "HARU", name: "HARU", src: "/characters/HARU.webp" },
];

export const DEFAULT_AVATAR = AVATAR_OPTIONS[0].id;

export function avatarSrc(id?: string): string | null {
  return AVATAR_OPTIONS.find((a) => a.id === id)?.src ?? null;
}
