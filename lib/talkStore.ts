/* 相談(/talk)の呼び名・年代と、面談練習(/session)のカウンセリングLv の保存（localStorage）。SSR中は呼ばないこと。 */

export interface TalkProfile {
  nickname: string; // 空文字 = 入力しない
  ageGroup: string; // 空文字 = 答えない
}

export interface Counseling {
  lv: number;
  xp: number;
}

const PROFILE_KEY = "talk_profile";
const COUNSELING_KEY = "talk_counseling";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 容量超過などは無視 */ }
}

/* ── プロフィール ── */
export function getProfile(): TalkProfile | null {
  return read<TalkProfile | null>(PROFILE_KEY, null);
}
export function saveProfile(p: TalkProfile) { write(PROFILE_KEY, p); }
export function clearProfile() { try { localStorage.removeItem(PROFILE_KEY); } catch { /* noop */ } }

/* ── カウンセリングLv（面談練習モード） ── */
export const XP_PER_COACH_MESSAGE = 10;

export function xpNeeded(lv: number): number {
  return 50 + 25 * (lv - 1);
}
export function getCounseling(): Counseling {
  return read<Counseling>(COUNSELING_KEY, { lv: 1, xp: 0 });
}
export function addCounselingXp(amount: number): { state: Counseling; leveledUp: boolean } {
  const cur = getCounseling();
  let { lv, xp } = cur;
  xp += amount;
  let leveledUp = false;
  while (xp >= xpNeeded(lv)) {
    xp -= xpNeeded(lv);
    lv += 1;
    leveledUp = true;
  }
  const state = { lv, xp };
  write(COUNSELING_KEY, state);
  return { state, leveledUp };
}
