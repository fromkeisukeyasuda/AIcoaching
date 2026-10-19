import { recordUsage, UID_PATTERN, UsageEvent, UsageMode } from "@/lib/usage";

export const maxDuration = 10;

const EVENTS: UsageEvent[] = ["session", "turn", "eval"];
const MODES: UsageMode[] = ["practice", "consult"];

/** 利用状況の記録。回数だけを数える（会話の内容は、受け取らない・保存しない）。失敗しても、アプリには影響させない */
export async function POST(req: Request) {
  try {
    const { uid, event, mode } = await req.json();
    if (typeof uid !== "string" || !UID_PATTERN.test(uid)) return new Response(null, { status: 204 });
    if (!EVENTS.includes(event) || !MODES.includes(mode)) return new Response(null, { status: 204 });
    await recordUsage(uid, event, mode);
  } catch {
    /* 記録できなくても、何も返さない */
  }
  return new Response(null, { status: 204 });
}
