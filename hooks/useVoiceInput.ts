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
 * 「無制限」のときは、無音では終えず、finish()（送信ボタン）で、全文を onResult で返す。停止ボタンでは、入力欄に残すだけ。
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
  const hadErrorRef = useRef(false);                // 今回の認識で、エラーの表示が出ているか
  const manualRef = useRef(false);                  // 「無制限」: 無音では送らず、送信ボタンを押すまで聞き続ける
  const [manualMode, setManualMode] = useState(false);
  const stoppedRef = useRef(false);                 // 利用者が止めた（止めるまでは、聞き続ける）
  const baseRef = useRef("");                       // 「無制限」で、認識をつなぎ直す前までの全文

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
    else {
      onInterimRef.current?.("");
      // 何も聞き取れずに終わったときは、反応がないように見えないよう、知らせる
      if (!hadErrorRef.current) setErrorMsg("うまく聞き取れませんでした。もう一度、マイクボタンを押して話してください。");
    }
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
      if (manualRef.current && !stoppedRef.current) {
        // ブラウザが、自分で認識を終えても、聞き続ける（それまでの全文を引き継いで、つなぎ直す）
        baseRef.current = textRef.current;
        setTimeout(() => {
          if (stoppedRef.current) return;
          const r2 = create(SR);
          activeRef.current = r2;
          try { r2.start(); } catch { setStatus("idle"); }
        }, 150);
        return;
      }
      setStatus("idle");
      if (!manualRef.current) deliver();
    };

    r.onerror = (e: ISpeechRecognitionErrorEvent) => {
      // 「無制限」では、無音・中断は、エラーにせず、つなぎ直す
      if (manualRef.current && !stoppedRef.current && (e.error === "no-speech" || e.error === "aborted")) return;
      if (manualRef.current) stoppedRef.current = true; // ほかのエラーは、止める
      setStatus("idle");
      hadErrorRef.current = true;

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
      let text = manualRef.current ? baseRef.current : "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      textRef.current = text;
      setErrorMsg("");
      onInterimRef.current?.(text);

      // 「無制限」では、無音で終えない（送信ボタンを押すまで、聞き続ける）
      if (manualRef.current) return;

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
    baseRef.current = "";
    doneRef.current = false;
    hadErrorRef.current = false;
    stoppedRef.current = false;
    manualRef.current = getSettings().voiceWait === "manual" && !!onInterimRef.current;
    setManualMode(manualRef.current);
    setErrorMsg("");
    const r = create(SR);
    activeRef.current = r;
    setStatus("recording");
    try {
      r.start();
    } catch {
      // 前の認識が終わりきっていないと、開始に失敗することがある。少し待って、1回だけやり直す
      setTimeout(() => {
        const r2 = create(SR);
        activeRef.current = r2;
        try { r2.start(); } catch { setStatus("idle"); doneRef.current = true; setErrorMsg("音声入力を開始できませんでした。もう一度、お試しください。"); }
      }, 300);
    }
  }, [create]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    try { activeRef.current?.stop(); } catch { /* ignore */ }
    setStatus("idle");
    if (manualRef.current) { doneRef.current = true; return; } // 「無制限」: 認識した分は、入力欄に残す（送らない）
    deliver(); // ここまでに認識した分を、渡す
  }, [deliver]);

  /** 「無制限」で、送信ボタンを押したとき: 聞き取りを止めて、そこまでの全文を渡す */
  const finish = useCallback(() => {
    stoppedRef.current = true;
    try { activeRef.current?.stop(); } catch { /* ignore */ }
    setStatus("idle");
    // 止めた直後に届く、最後の認識結果を待ってから、渡す
    setTimeout(() => {
      doneRef.current = true;
      const text = textRef.current.trim();
      textRef.current = "";
      if (text) onResultRef.current(text);
    }, 350);
  }, []);

  const toggle = useCallback(() => {
    if (status === "recording") stop();
    else start();
  }, [status, start, stop]);

  // アンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      clearTimer();
      stoppedRef.current = true;
      try { activeRef.current?.abort(); } catch { /* ignore */ }
    };
  }, []);

  return { status, errorMsg, toggle, finish, manualMode };
}
