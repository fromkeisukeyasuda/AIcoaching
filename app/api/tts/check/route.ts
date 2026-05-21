// VoiceBoxの起動確認とスピーカー一覧を返すエンドポイント
export async function GET() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch("http://127.0.0.1:50021/speakers", {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error("VoiceBox error");
    const speakers = await res.json();
    return Response.json({ available: true, speakers });
  } catch {
    clearTimeout(timer);
    return Response.json({ available: false, speakers: [] });
  }
}
