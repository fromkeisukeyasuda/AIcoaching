// VoiceBoxの起動確認とスピーカー一覧を返すエンドポイント
import { voicevoxFetch, VOICEVOX_IS_REMOTE, VOICEVOX_COLD_START_MS } from "@/lib/voicevox";

export const maxDuration = 60;

// スピーカー一覧はほとんど変わらないので、一定時間、使い回す（クラウドの起動待ちを減らす）
let cache: { at: number; speakers: unknown[] } | null = null;
const CACHE_MS = 10 * 60_000;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return Response.json({ available: true, speakers: cache.speakers });
  }
  try {
    const res = await voicevoxFetch("/speakers", {
      timeoutMs: VOICEVOX_IS_REMOTE ? VOICEVOX_COLD_START_MS : 2_000,
    });
    if (!res.ok) throw new Error("VoiceBox error");
    const speakers = await res.json();
    cache = { at: Date.now(), speakers };
    return Response.json({ available: true, speakers });
  } catch {
    return Response.json({ available: false, speakers: [] });
  }
}
