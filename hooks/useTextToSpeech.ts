"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceBoxSpeakerStyle {
  id: number;
  name: string;
  speakerName: string;
}

interface QueueItem {
  text: string;
  /** 音声データの先行取得（pushChunk時に即開始） */
  blobPromise: Promise<Blob | null>;
}

export function useTextToSpeech() {
  const [enabled, setEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [voiceBoxAvailable, setVoiceBoxAvailable] = useState(false);
  const [speakerStyles, setSpeakerStyles] = useState<VoiceBoxSpeakerStyle[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState(3);

  // ref で最新値を保持（コールバックのクロージャ問題を回避）
  const voiceBoxRef = useRef(false);
  const speakerIdRef = useRef(3);
  const enabledRef = useRef(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const browserVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  useEffect(() => { voiceBoxRef.current = voiceBoxAvailable; }, [voiceBoxAvailable]);
  useEffect(() => { speakerIdRef.current = selectedSpeakerId; }, [selectedSpeakerId]);

  // VoiceBox 確認 & ブラウザ音声準備
  useEffect(() => {
    fetch("/api/tts/check")
      .then((r) => r.json())
      .then((data) => {
        setVoiceBoxAvailable(data.available);
        voiceBoxRef.current = data.available;
        if (data.available && Array.isArray(data.speakers)) {
          const styles: VoiceBoxSpeakerStyle[] = data.speakers.flatMap(
            (sp: { name: string; styles: { id: number; name: string }[] }) =>
              sp.styles.map((st) => ({ id: st.id, name: st.name, speakerName: sp.name }))
          );
          setSpeakerStyles(styles);
        }
      })
      .catch(() => {});

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

  /** VoiceBox から WAV を取得（非同期・プリフェッチ用） */
  const prefetch = useCallback((text: string): Promise<Blob | null> => {
    return fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, speaker: speakerIdRef.current }),
    })
      .then((r) => (r.ok ? r.blob() : null))
      .catch(() => null);
  }, []);

  /** WAV Blob を再生して完了まで待つ */
  const playBlob = useCallback((blob: Blob): Promise<void> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      const done = () => { URL.revokeObjectURL(url); audioRef.current = null; resolve(); };
      audio.onended = done;
      audio.onerror = done;
      audio.play().catch(done);
    });
  }, []);

  /** ブラウザ TTS で再生して完了まで待つ */
  const speakBrowser = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ja-JP";
      u.rate = 1.05;
      if (browserVoiceRef.current) u.voice = browserVoiceRef.current;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    });
  }, []);

  /** キューを順番に処理するループ */
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return; // 既に実行中
    isProcessingRef.current = true;
    setSpeaking(true);

    while (queueRef.current.length > 0 && isProcessingRef.current) {
      const item = queueRef.current.shift()!;

      // プリフェッチ済みの Blob を await（既に終わっていれば即返る）
      const blob = voiceBoxRef.current ? await item.blobPromise : null;

      if (!isProcessingRef.current) break; // stop() された

      if (blob) {
        await playBlob(blob);
      } else {
        await speakBrowser(item.text);
      }
    }

    if (isProcessingRef.current) {
      isProcessingRef.current = false;
      setSpeaking(false);
    }
  }, [playBlob, speakBrowser]);

  /**
   * テキストをキューに追加して再生開始。
   * 追加と同時に VoiceBox の音声取得を開始する（プリフェッチ）。
   * 再生中に次のチャンクが追加されると、再生終了後すぐに次が流れる。
   */
  const pushChunk = useCallback(
    (text: string) => {
      if (!enabledRef.current || !text.trim()) return;

      const blobPromise = voiceBoxRef.current
        ? prefetch(text)        // ← 追加と同時に取得開始（再生待ちしない）
        : Promise.resolve(null);

      queueRef.current.push({ text, blobPromise });
      processQueue(); // 既に処理中なら即return
    },
    [prefetch, processQueue]
  );

  /** 再生停止・キュークリア */
  const stop = useCallback(() => {
    queueRef.current = [];
    isProcessingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const toggle = useCallback(() => {
    if (speaking) stop();
    setEnabled((prev) => !prev);
  }, [speaking, stop]);

  return {
    enabled, speaking, voiceBoxAvailable,
    speakerStyles, selectedSpeakerId, setSelectedSpeakerId,
    pushChunk, stop, toggle,
  };
}
