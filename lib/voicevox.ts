/* VOICEVOX エンジンへの接続（サーバー側のみ）
   - VOICEVOX_URL が未設定なら、同じPCの http://127.0.0.1:50021 に接続（今までどおり）
   - VOICEVOX_URL を設定すると、クラウド（Cloud Run など）のエンジンに接続
   - VOICEVOX_SA_JSON を設定すると、Cloud Run の「認証必須」サービスを、サービスアカウントのIDトークンで呼ぶ */
import { createSign } from "node:crypto";

const RAW_URL = process.env.VOICEVOX_URL?.trim();
export const VOICEVOX_BASE = (RAW_URL || "http://127.0.0.1:50021").replace(/\/+$/, "");
export const VOICEVOX_IS_REMOTE = Boolean(RAW_URL);

/** クラウドのエンジンは、停止中だと起動に10〜30秒かかる。ローカルは短くてよい */
export const VOICEVOX_COLD_START_MS = 50_000;

interface ServiceAccount { client_email: string; private_key: string }

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.VOICEVOX_SA_JSON?.trim();
  if (!raw) return null;
  try {
    const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf-8");
    const json = JSON.parse(text) as ServiceAccount;
    return json.client_email && json.private_key ? json : null;
  } catch {
    return null;
  }
}

const b64url = (v: Buffer | string) => Buffer.from(v).toString("base64url");

let tokenCache: { token: string; expiresAt: number } | null = null;

/** サービスアカウントで、Cloud Run 用のIDトークンを取得する（1時間キャッシュ） */
async function getIdToken(audience: string): Promise<string | null> {
  const sa = loadServiceAccount();
  if (!sa) return null;
  if (tokenCache && tokenCache.expiresAt - 60_000 > Date.now()) return tokenCache.token;

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      sub: sa.client_email,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      target_audience: audience,
    })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = b64url(signer.sign(sa.private_key));

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error("voicevox auth failed");
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("voicevox auth failed");
  tokenCache = { token: data.id_token, expiresAt: Date.now() + 55 * 60_000 };
  return data.id_token;
}

/** VOICEVOX エンジンを呼ぶ。接続先・認証・タイムアウトをまとめて扱う */
export async function voicevoxFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = VOICEVOX_IS_REMOTE ? VOICEVOX_COLD_START_MS : 5_000, ...rest } = init;
  const headers = new Headers(rest.headers);
  const token = await getIdToken(VOICEVOX_BASE);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${VOICEVOX_BASE}${path}`, { ...rest, headers, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
