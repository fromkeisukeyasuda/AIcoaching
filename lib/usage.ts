import { createClient } from "redis";

/* 利用状況（匿名の利用者IDごとの回数）の記録。会話の内容は、一切、記録しない。
   保存先は、環境変数 REDIS_URL の Redis。未設定なら、何もしない（ローカル開発など）。

   Redis の中身:
     users          … 利用者IDの集合
     u:{id}         … ハッシュ。first / last / practice_sessions / practice_turns / consult_sessions / consult_turns / evals
     d:{YYYY-MM-DD} … ハッシュ。その日の sessions / turns / evals
     da:{YYYY-MM-DD}… その日に使った利用者IDの集合 */

export type UsageEvent = "session" | "turn" | "eval";
export type UsageMode = "practice" | "consult";

const makeClient = () =>
  createClient({
    url: process.env.REDIS_URL,
    socket: { connectTimeout: 4000, reconnectStrategy: (n) => (n > 2 ? false : 200) },
  });
type RedisClient = ReturnType<typeof makeClient>;

const g = globalThis as unknown as { __rmRedis?: Promise<RedisClient | null> };

/** Redis に接続する（サーバーレスでも、使い回す）。つながらなければ null */
export function getRedis(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return Promise.resolve(null);
  const existing = g.__rmRedis;
  if (existing) return existing;
  const created: Promise<RedisClient | null> = (async () => {
    try {
      const client = makeClient();
      client.on("error", () => { /* 接続の失敗は、記録しないだけ。アプリの動作には、影響させない */ });
      await client.connect();
      return client;
    } catch {
      g.__rmRedis = undefined; // 次の呼び出しで、つなぎ直す
      return null;
    }
  })();
  g.__rmRedis = created;
  return created;
}

export const UID_PATTERN = /^[a-z0-9]{6,16}$/;

const today = (d = new Date()) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10); // 日本時間の日付

export async function recordUsage(uid: string, event: UsageEvent, mode: UsageMode): Promise<boolean> {
  const r = await getRedis();
  if (!r) return false;
  const now = new Date().toISOString();
  const day = today();
  const field =
    event === "eval" ? "evals" : `${mode}_${event === "session" ? "sessions" : "turns"}`;
  const dayField = event === "eval" ? "evals" : event === "session" ? "sessions" : "turns";
  await r
    .multi()
    .sAdd("users", uid)
    .hSetNX(`u:${uid}`, "first", now)
    .hSet(`u:${uid}`, "last", now)
    .hIncrBy(`u:${uid}`, field, 1)
    .hIncrBy(`d:${day}`, dayField, 1)
    .sAdd(`da:${day}`, uid)
    .exec();
  return true;
}

export interface UserUsage {
  uid: string;
  first: string;
  last: string;
  practiceSessions: number;
  practiceTurns: number;
  consultSessions: number;
  consultTurns: number;
  evals: number;
}

export interface DayUsage { date: string; sessions: number; turns: number; evals: number; users: number }

const num = (v?: string) => Number(v ?? 0) || 0;

export async function readUsage(days = 14): Promise<{ users: UserUsage[]; daily: DayUsage[] } | null> {
  const r = await getRedis();
  if (!r) return null;

  const ids = await r.sMembers("users");
  const rows = await Promise.all(ids.map((uid) => r.hGetAll(`u:${uid}`)));
  const users: UserUsage[] = ids
    .map((uid, i) => ({
      uid,
      first: rows[i].first ?? "",
      last: rows[i].last ?? "",
      practiceSessions: num(rows[i].practice_sessions),
      practiceTurns: num(rows[i].practice_turns),
      consultSessions: num(rows[i].consult_sessions),
      consultTurns: num(rows[i].consult_turns),
      evals: num(rows[i].evals),
    }))
    .sort((a, b) => b.last.localeCompare(a.last));

  const dates = Array.from({ length: days }, (_, i) => today(new Date(Date.now() - i * 86400_000)));
  const daily: DayUsage[] = await Promise.all(
    dates.map(async (date) => {
      const [h, n] = await Promise.all([r.hGetAll(`d:${date}`), r.sCard(`da:${date}`)]);
      return { date, sessions: num(h.sessions), turns: num(h.turns), evals: num(h.evals), users: n };
    })
  );
  return { users, daily };
}

/** 利用者1人ぶんの記録を消す（テスト用のIDの掃除など） */
export async function deleteUser(uid: string): Promise<void> {
  const r = await getRedis();
  if (!r || !UID_PATTERN.test(uid)) return;
  await r.multi().sRem("users", uid).del(`u:${uid}`).exec();
}
