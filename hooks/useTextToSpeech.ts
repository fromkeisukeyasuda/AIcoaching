"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getSettings, saveSettings } from "@/lib/settings";

export interface VoiceBoxSpeakerStyle {
  id: number;
  name: string;
  speakerName: string;
}

/** 無音の WAV（スマホの自動再生の制限を解除するための、ごく短い音） */
const SILENT_WAV = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

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

  // VoiceBox の確認が終わるまでは、読み上げを待たせる（終わる前に来た最初の文を、取りこぼさない）
  const readyRef = useRef<{ promise: Promise<void>; resolve: () => void } | null>(null);
  if (!readyRef.current) {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => { resolve = r; });
    readyRef.current = { promise, resolve };
  }
  const stylesRef = useRef<VoiceBoxSpeakerStyle[]>([]);
  const prefsRef = useRef<string[]>([]);
  const unlockedRef = useRef(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const browserVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const queueRef = useRef<QueueItem[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);
  // 保存済みの設定（マイページ）を反映
  useEffect(() => { setEnabled(getSettings().voice); }, []);
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
          stylesRef.current = styles;
          setSpeakerStyles(styles);
          applyPrefs(); // 声の希望が先に決まっていれば、ここで反映する
        }
      })
      .catch(() => {})
      .finally(() => readyRef.current?.resolve());

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

  /** 希望の声（優先順位順）から、使える声を選ぶ。VoiceBox の確認前なら、確認が終わってから反映する */
  const applyPrefs = useCallback(() => {
    if (stylesRef.current.length === 0 || prefsRef.current.length === 0) return;
    for (const name of prefsRef.current) {
      const found =
        stylesRef.current.find((s) => s.speakerName === name && s.name === "ノーマル") ??
        stylesRef.current.find((s) => s.speakerName === name);
      if (found) {
        speakerIdRef.current = found.id;
        setSelectedSpeakerId(found.id);
        return;
      }
    }
  }, []);

  const setVoicePrefs = useCallback((prefs: string[]) => {
    prefsRef.current = prefs;
    applyPrefs();
  }, [applyPrefs]);

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
      // 1つの <audio> を使い回す（スマホは、タップで一度許可した <audio> だけ、あとから鳴らせるため）
      const audio = (audioElRef.current ??= new Audio());
      audioRef.current = audio;
      const done = () => {
        audio.onended = null;
        audio.onerror = null;
        URL.revokeObjectURL(url);
        audioRef.current = null;
        resolve();
      };
      audio.onended = done;
      audio.onerror = done;
      audio.src = url;
      audio.play().catch(done);
    });
  }, []);

  /** 画面をタップした操作の中で呼ぶ。スマホの「自動再生の制限」を、先に解除しておく */
  const unlock = useCallback(() => {
    if (unlockedRef.current || typeof window === "undefined") return;
    unlockedRef.current = true;
    const audio = (audioElRef.current ??= new Audio());
    audio.src = SILENT_WAV;
    audio.play().catch(() => { unlockedRef.current = false; });
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
      const blob = await item.blobPromise;

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

      // VoiceBox の確認が終わるのを待ってから、取得を始める（最大 25 秒。それ以上は、ブラウザの声で読む）
      const blobPromise = Promise.race([
        readyRef.current!.promise,
        new Promise<void>((r) => setTimeout(r, 25_000)),
      ]).then(() => (voiceBoxRef.current ? prefetch(text) : null));

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
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    saveSettings({ voice: next }); // マイページの設定と、同じものを使う
  }, [speaking, stop]);

  return {
    enabled, speaking, voiceBoxAvailable,
    speakerStyles, selectedSpeakerId, setSelectedSpeakerId,
    pushChunk, stop, toggle, unlock, setVoicePrefs,
  };
}
