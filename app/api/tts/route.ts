// VoiceBox（VOICEVOX）へのプロキシ。CORS回避と、接続先・認証の切り替えのため、サーバー経由で呼び出す
import { voicevoxFetch } from "@/lib/voicevox";

// クラウドのエンジンが停止中のとき、起動を待つ時間（Vercelの関数の最長実行時間）
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 300; // 1回の読み上げは1文ずつ。長すぎる依頼は断る（費用を守るため）

export async function POST(req: Request) {
  const { text, speaker = 3 }: { text: string; speaker?: number } = await req.json();

  if (!text?.trim()) {
    return Response.json({ error: "テキストが空です" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json({ error: "テキストが長すぎます" }, { status: 413 });
  }
  if (!Number.isInteger(speaker) || speaker < 0 || speaker > 9999) {
    return Response.json({ error: "スピーカーが正しくありません" }, { status: 400 });
  }

  try {
    // 1. 音声クエリ生成
    const queryRes = await voicevoxFetch(
      `/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
      { method: "POST" }
    );
    if (!queryRes.ok) throw new Error("audio_query failed");
    const audioQuery = await queryRes.json();

    // 2. 音声合成
    const synthRes = await voicevoxFetch(`/synthesis?speaker=${speaker}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
    });
    if (!synthRes.ok) throw new Error("synthesis failed");

    const audioBuffer = await synthRes.arrayBuffer();
    return new Response(audioBuffer, { headers: { "Content-Type": "audio/wav" } });
  } catch {
    return Response.json(
      { error: "VoiceBoxへの接続に失敗しました。VoiceBoxが起動しているか確認してください。" },
      { status: 503 }
    );
  }
}
