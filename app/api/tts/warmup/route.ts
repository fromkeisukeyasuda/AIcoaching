// クラウドのVOICEVOXを、先に起こしておくためのエンドポイント。
// アプリを開いた直後に呼んでおくと、最初の読み上げまでに、エンジンの起動が終わっている。
import { voicevoxFetch, VOICEVOX_IS_REMOTE, VOICEVOX_COLD_START_MS } from "@/lib/voicevox";

export const maxDuration = 60;

export async function GET() {
  // 同じPCのVOICEVOXは、いつでも起きているので何もしない
  if (!VOICEVOX_IS_REMOTE) return Response.json({ ok: true, skipped: true });
  try {
    const res = await voicevoxFetch("/version", { timeoutMs: VOICEVOX_COLD_START_MS });
    return Response.json({ ok: res.ok });
  } catch {
    return Response.json({ ok: false });
  }
}
