"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export type VoiceInputStatus = "idle" | "recording" | "unsupported";

// Web Speech API の型定義
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
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [status, setStatus] = useState<VoiceInputStatus>("idle");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
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

    recognition.onstart = () => setStatus("recording");
    recognition.onend = () => setStatus("idle");
    recognition.onerror = () => setStatus("idle");
    recognition.onresult = (e: SpeechRecognitionResultEvent) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript);
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const start = useCallback(() => {
    if (status === "unsupported") return;
    try { recognitionRef.current?.start(); } catch { /* already started */ }
  }, [status]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
  }, []);

  const toggle = useCallback(() => {
    status === "recording" ? stop() : start();
  }, [status, start, stop]);

  return { status, toggle };
}
