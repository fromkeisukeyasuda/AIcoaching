"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceInputStatus = "idle" | "recording" | "unsupported";

// Web Speech API 型定義
interface ISpeechRecognitionResult {
  readonly length: number;
  [index: number]: { transcript: string };
}
interface ISpeechRecognitionResultList {
  readonly length: number;
  [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionEvent {
  readonly results: ISpeechRecognitionResultList;
}
interface ISpeechRecognitionErrorEvent {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type ISpeechRecognitionCtor = new () => ISpeechRecognition;

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "マイクのアクセスが拒否されています。ブラウザのアドレスバー横 🔒 からマイクを「許可」にしてください。",
  "no-speech": "音声が検出されませんでした。もう少し大きな声で話してみてください。",
  "audio-capture":
    "マイクが見つかりません。PCにマイクが接続されているか確認してください。",
  "network": "",   // 下で別処理
  "aborted": "",
};

function getSR(): ISpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: ISpeechRecognitionCtor;
    webkitSpeechRecognition?: ISpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const onResultRef = useRef(onResult);
  const activeRef = useRef<ISpeechRecognition | null>(null);
  const networkRetryRef = useRef(0);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (!getSR()) setStatus("unsupported");
  }, []);

  // 毎回新しいインスタンスを生成して接続をリフレッシュ
  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) return;

    // 前の認識を止める
    try { activeRef.current?.abort(); } catch { /* ignore */ }

    const r = new SR();
    r.lang = "ja-JP";
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 1;

    r.onstart = () => {
      setStatus("recording");
      setErrorMsg("");
      networkRetryRef.current = 0;
    };

    r.onend = () => {
      setStatus("idle");
    };

    r.onerror = (e: ISpeechRecognitionErrorEvent) => {
      setStatus("idle");

      if (e.error === "network") {
        networkRetryRef.current += 1;
        if (networkRetryRef.current <= 2) {
          // 少し待ってから自動リトライ（最大2回）
          setTimeout(() => {
            const r2 = new SR();
            r2.lang = "ja-JP";
            r2.continuous = false;
            r2.interimResults = false;
            r2.maxAlternatives = 1;
            r2.onstart = r.onstart;
            r2.onend = r.onend;
            r2.onerror = (e2) => {
              if (e2.error === "network") {
                setErrorMsg(
                  "Chromeの音声認識サーバーへの接続に失敗しました。\n" +
                  "① Windowsの設定 → プライバシー → マイクで「アプリのアクセスを許可」を確認\n" +
                  "② chrome://settings/content/microphone でlocalhost が許可されているか確認"
                );
              }
            };
            r2.onresult = r.onresult;
            activeRef.current = r2;
            try { r2.start(); } catch { /* ignore */ }
          }, 500);
          return;
        }
        setErrorMsg(
          "Chromeの音声認識サーバーへの接続に失敗しました。\n" +
          "① Windowsの設定 → プライバシー → マイクで「アプリのアクセスを許可」を確認\n" +
          "② chrome://settings/content/microphone でlocalhost が許可されているか確認"
        );
        return;
      }

      const msg = ERROR_MESSAGES[e.error];
      if (msg !== undefined && msg !== "") setErrorMsg(msg);
    };

    r.onresult = (e: ISpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      if (transcript) onResultRef.current(transcript);
      setErrorMsg("");
    };

    activeRef.current = r;
    setStatus("recording");
    try { r.start(); } catch { setStatus("idle"); }
  }, []);

  const stop = useCallback(() => {
    try { activeRef.current?.stop(); } catch { /* ignore */ }
    setStatus("idle");
  }, []);

  const toggle = useCallback(() => {
    if (status === "recording") stop();
    else start();
  }, [status, start, stop]);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      try { activeRef.current?.abort(); } catch { /* ignore */ }
    };
  }, []);

  return { status, errorMsg, toggle };
}
