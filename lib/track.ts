/* 利用状況の記録（クライアント側）。匿名の利用者IDと、回数だけを送る。会話の内容は、送らない */
const KEY = "rm_uid";

export type TrackEvent = "session" | "turn" | "eval";
export type TrackMode = "practice" | "consult";

/** この端末（ブラウザ）の、匿名の利用者ID。初めて使うときに、ランダムに作る */
export function getUid(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && /^[a-z0-9]{6,16}$/.test(saved)) return saved;
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const id = Array.from(bytes, (b) => (b % 36).toString(36)).join("");
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return "";
  }
}

export function track(event: TrackEvent, mode: TrackMode) {
  try {
    const uid = getUid();
    if (!uid) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, event, mode }),
      keepalive: true,
    }).catch(() => { /* 記録できなくても、影響なし */ });
  } catch { /* noop */ }
}
