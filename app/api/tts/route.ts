// VoiceBoxへのプロキシ（CORS回避のためサーバー経由で呼び出す）
export async function POST(req: Request) {
  const { text, speaker = 3 }: { text: string; speaker?: number } =
    await req.json();

  if (!text?.trim()) {
    return Response.json({ error: "テキストが空です" }, { status: 400 });
  }

  try {
    // 1. 音声クエリ生成
    const queryRes = await fetch(
      `http://127.0.0.1:50021/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
      { method: "POST" }
    );
    if (!queryRes.ok) throw new Error("audio_query failed");
    const audioQuery = await queryRes.json();

    // 2. 音声合成
    const synthRes = await fetch(
      `http://127.0.0.1:50021/synthesis?speaker=${speaker}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(audioQuery),
      }
    );
    if (!synthRes.ok) throw new Error("synthesis failed");

    const audioBuffer = await synthRes.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { "Content-Type": "audio/wav" },
    });
  } catch {
    return Response.json(
      { error: "VoiceBoxへの接続に失敗しました。VoiceBoxが起動しているか確認してください。" },
      { status: 503 }
    );
  }
}
