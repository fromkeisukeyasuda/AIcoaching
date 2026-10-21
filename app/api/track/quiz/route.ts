import { recordQuiz, UID_PATTERN } from "@/lib/usage";

export const maxDuration = 10;

/** クイズの回答の記録。回数と、正解かどうかだけを数える（問題の内容や選んだ選択肢は、受け取らない）。失敗しても、アプリには影響させない */
export async function POST(req: Request) {
  try {
    const { uid, correct } = await req.json();
    if (typeof uid !== "string" || !UID_PATTERN.test(uid)) return new Response(null, { status: 204 });
    if (typeof correct !== "boolean") return new Response(null, { status: 204 });
    await recordQuiz(uid, correct);
  } catch {
    /* 記録できなくても、何も返さない */
  }
  return new Response(null, { status: 204 });
}
