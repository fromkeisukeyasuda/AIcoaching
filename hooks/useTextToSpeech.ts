"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceBoxSpeakerStyle {
  id: number;
  name: string;
  speakerName: string;
}

export function useTextToSpeech() {
  const [enabled, setEnabled] = useState(true); // デフォルトON
  const [speaking, setSpeaking] = useState(false);
  const [voiceBoxAvailable, setVoiceBoxAvailable] = useState(false);
  const [speakerStyles, setSpeakerStyles] = useState<VoiceBoxSpeakerStyle[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(3); // ずんだもん(ノーマル)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const browserVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // 起動時にVoiceBox確認 & ブラウザ音声準備
  useEffect(() => {
    fetch("/api/tts/check")
      .then((r) => r.json())
      .then((data) => {
        setVoiceBoxAvailable(data.available);
        if (data.available && Array.isArray(data.speakers)) {
          // スピーカーリストをフラットなスタイル一覧に変換
          const styles: VoiceBoxSpeakerStyle[] = data.speakers.flatMap(
            (sp: { name: string; styles: { id: number; name: string }[] }) =>
              sp.styles.map((st) => ({
                id: st.id,
                name: st.name,
                speakerName: sp.name,
              }))
          );
          setSpeakerStyles(styles);
        }
      })
      .catch(() => setVoiceBoxAvailable(false));

    // ブラウザTTSの音声準備（VoiceBoxが使えない場合のフォールバック）
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const pick = () => {
        const voices = window.speechSynthesis.getVoices();
        browserVoiceRef.current =
          voices.find((v) => v.lang === "ja-JP" && v.localService) ||
          voices.find((v) => v.lang === "ja-JP") ||
          null;
      };
      pick();
      window.speechSynthesis.onvoiceschanged = pick;
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speakWithVoiceBox = useCallback(
    async (text: string) => {
      stopAudio();
      setSpeaking(true);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, speaker: selectedSpeakerId }),
        });
        if (!res.ok) throw new Error("TTS failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeaking(false);
          URL.revokeObjectURL(url);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setSpeaking(false);
          audioRef.current = null;
        };
        await audio.play();
      } catch {
        setSpeaking(false);
      }
    },
    [selectedSpeakerId, stopAudio]
  );

  const speakWithBrowser = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    u.rate = 1.05;
    if (browserVoiceRef.current) u.voice = browserVoiceRef.current;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !text.trim()) return;
      voiceBoxAvailable ? speakWithVoiceBox(text) : speakWithBrowser(text);
    },
    [enabled, voiceBoxAvailable, speakWithVoiceBox, speakWithBrowser]
  );

  const toggle = useCallback(() => {
    if (speaking) stopAudio();
    setEnabled((prev) => !prev);
  }, [speaking, stopAudio]);

  return {
    enabled,
    speaking,
    voiceBoxAvailable,
    speakerStyles,
    selectedSpeakerId,
    setSelectedSpeakerId,
    speak,
    stop: stopAudio,
    toggle,
  };
}
