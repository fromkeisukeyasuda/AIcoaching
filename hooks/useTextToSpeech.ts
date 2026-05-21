"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useTextToSpeech() {
  const [enabled, setEnabled] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // 日本語音声を優先選択
      const jaVoice =
        voices.find((v) => v.lang === "ja-JP" && v.localService) ||
        voices.find((v) => v.lang === "ja-JP") ||
        voices.find((v) => v.lang.startsWith("ja")) ||
        null;
      voiceRef.current = jaVoice;
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !enabled) return;
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ja-JP";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      if (voiceRef.current) utterance.voice = voiceRef.current;

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [supported, enabled]
  );

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (speaking) stop();
    setEnabled((prev) => !prev);
  }, [speaking, stop]);

  return { enabled, speaking, supported, speak, stop, toggle };
}
