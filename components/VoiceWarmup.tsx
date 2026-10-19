"use client";

import { useEffect } from "react";

const KEY = "voicevox_warmup_at";
const INTERVAL_MS = 8 * 60_000; // クラウドのエンジンが眠る前に、もう一度起こす目安

/** アプリを開いた直後に、クラウドのVOICEVOXを起こしておく（見た目はなし）。最初の読み上げの待ち時間を減らす */
export default function VoiceWarmup() {
  useEffect(() => {
    try {
      const last = Number(sessionStorage.getItem(KEY) ?? 0);
      if (Date.now() - last < INTERVAL_MS) return;
      sessionStorage.setItem(KEY, String(Date.now()));
    } catch { /* storage が使えなくても、起こすだけなので続行 */ }
    fetch("/api/tts/warmup", { keepalive: true }).catch(() => { /* 失敗しても影響なし */ });
  }, []);
  return null;
}
