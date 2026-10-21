"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSettings, voiceWaitMs } from "@/lib/settings";

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

const NETWORK_ERROR =
  "Chromeの音声認識サーバーへの接続に失敗しました。\n" +
  "① Windowsの設定 → プライバシー → マイクで「アプリのアクセスを許可」を確認\n" +
  "② chrome://settings/content/microphone でlocalhost が許可されているか確認";

function getSR(): ISpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: ISpeechRecognitionCtor;
    webkitSpeechRecognition?: ISpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * 音声入力。話している間は、途中の認識結果を onInterim で返す。
 * 無音がマイページで選んだ長さ（短め・ふつう・長め）続くか、停止ボタンを押すと、そこまでの全文を onResult で1回だけ返す。
 */
export function useVoiceInput(onResult: (text: string) => void, onInterim?: (text: string) => void) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const onResultRef = useRef(onResult);
  const onInterimRef = useRef(onInterim);
  const activeRef = useRef<ISpeechRecognition | null>(null);
  const networkRetryRef = useRef(0);
  const textRef = useRef("");                       // ここまでに認識した全文
  const doneRef = useRef(true);                     // 今回の認識の結果を、渡し終えたか
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { onInterimRef.current = onInterim; }, [onInterim]);

  useEffect(() => {
    if (!getSR()) setStatus("unsupported");
  }, []);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  /** 認識した全文を、1回だけ渡す */
  const deliver = useCallback(() => {
    clearTimer();
    if (doneRef.current) return;
    doneRef.current = true;
    const text = textRef.current.trim();
    textRef.current = "";
    if (text) onResultRef.current(text);
    else onInterimRef.current?.("");
  }, []);

  // 毎回新しいインスタンスを生成して接続をリフレッシュ
  const create = useCallback((SR: ISpeechRecognitionCtor): ISpeechRecognition => {
    const r = new SR();
    r.lang = "ja-JP";
    r.continuous = true;        // 間を置いて話しても、切れない
    r.interimResults = true;    // 話している途中の結果も受け取る
    r.maxAlternatives = 1;

    r.onstart = () => {
      setStatus("recording");
      setErrorMsg("");
      networkRetryRef.current = 0;
    };

    r.onend = () => {
      setStatus("idle");
      deliver();
    };

    r.onerror = (e: ISpeechRecognitionErrorEvent) => {
      setStatus("idle");

      if (e.error === "network") {
        networkRetryRef.current += 1;
        if (networkRetryRef.current <= 2) {
          // 少し待ってから自動リトライ（最大2回）
          setTimeout(() => {
            const r2 = create(SR);
            activeRef.current = r2;
            try { r2.start(); } catch { /* ignore */ }
          }, 500);
          return;
        }
        setErrorMsg(NETWORK_ERROR);
        return;
      }

      const msg = ERROR_MESSAGES[e.error];
      if (msg !== undefined && msg !== "") setErrorMsg(msg);
    };

    r.onresult = (e: ISpeechRecognitionEvent) => {
      // 全部の結果をつなげる（確定した分も、認識中の分も）
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      textRef.current = text;
      setErrorMsg("");
      onInterimRef.current?.(text);

      // 結果が出るたびに、無音の計測をやり直す。一定時間、何も出なければ、話し終えたとみなす
      clearTimer();
      timerRef.current = setTimeout(() => {
        try { activeRef.current?.stop(); } catch { /* ignore */ }
        deliver();
      }, voiceWaitMs(getSettings().voiceWait));
    };

    return r;
  }, [deliver]);

  const start = useCallback(() => {
    const SR = getSR();
    if (!SR) return;

    // 前の認識を止める
    clearTimer();
    try { activeRef.current?.abort(); } catch { /* ignore */ }

    textRef.current = "";
    doneRef.current = false;
    const r = create(SR);
    activeRef.current = r;
    setStatus("recording");
    try { r.start(); } catch { setStatus("idle"); doneRef.current = true; }
  }, [create]);

  const stop = useCallback(() => {
    try { activeRef.current?.stop(); } catch { /* ignore */ }
    setStatus("idle");
    deliver(); // ここまでに認識した分を、渡す
  }, [deliver]);

  const toggle = useCallback(() => {
    if (status === "recording") stop();
    else start();
  }, [status, start, stop]);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      clearTimer();
      try { activeRef.current?.abort(); } catch { /* ignore */ }
    };
  }, []);

  return { status, errorMsg, toggle };
}
