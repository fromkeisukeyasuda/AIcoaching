"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type VoiceInputStatus = "idle" | "recording" | "unsupported";

interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResultEvent {
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "マイクへのアクセスが拒否されました。ブラウザの設定でマイクを許可してください。",
  "no-speech": "音声が検出されませんでした。もう一度話しかけてください。",
  "network": "ネットワークエラーが発生しました。",
  "audio-capture": "マイクが見つかりません。マイクが接続されているか確認してください。",
  "aborted": "",
};

export function useVoiceInput(onResult: (text: string) => void) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onResultRef = useRef(onResult);

  // onResult を ref で保持することで useEffect を再実行しない
  useEffect(() => { onResultRef.current = onResult; }, [onResult]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const w = window as Window & {
      SpeechRecognition?: ISpeechRecognitionConstructor;
      webkitSpeechRecognition?: ISpeechRecognitionConstructor;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;

    if (!SR) {
      setStatus("unsupported");
      return;
    }

    const recognition = new SR();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus("recording");
      setErrorMsg("");
    };
    recognition.onend = () => {
      setStatus("idle");
    };
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setStatus("idle");
      const msg = ERROR_MESSAGES[e.error] ?? `エラーが発生しました（${e.error}）`;
      if (msg) setErrorMsg(msg);
    };
    recognition.onresult = (e: SpeechRecognitionResultEvent) => {
      const transcript = e.results[0][0].transcript;
      onResultRef.current(transcript);
      setErrorMsg("");
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      try { recognition.abort(); } catch { /* ignore */ }
    };
  }, []); // マウント時1回だけ

  const start = useCallback(() => {
    setErrorMsg("");
    try {
      recognitionRef.current?.start();
    } catch {
      // already started — stop and restart
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    }
  }, []);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(() => {
    if (status === "recording") {
      stop();
    } else {
      start();
    }
  }, [status, start, stop]);

  return { status, errorMsg, toggle };
}
