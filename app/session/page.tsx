"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario } from "@/types";
import { scenarios as builtInScenarios } from "@/lib/scenarios";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import CharacterAvatar from "@/components/CharacterAvatar";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

/* ── Sound wave bars ── */
function SoundWave({ active }: { active: boolean }) {
  const heights = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 0.4, 0.75, 0.5];
  if (!active) {
    return (
      <div className="flex items-center justify-center gap-0.5 h-6">
        {heights.map((_, i) => (
          <div key={i} className="w-0.5 h-0.5 rounded-full bg-white/10" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-indigo-400"
          style={{
            height: `${h * 24}px`,
            transformOrigin: "center",
            animation: `soundwave ${0.5 + (i % 5) * 0.15}s ease-in-out ${i * 0.06}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* キャラクター別デフォルト音声（VOICEVOXスピーカー名、優先順位順） */
const CHARACTER_VOICE_PREFS: Record<string, string[]> = {
  "田中": ["玄野武宏", "白上虎太郎", "青山龍星"],   // 落ち着いた30代男性
  "佐藤": ["春日部つむぎ", "四国めたん", "九州そら"], // 明るい28歳女性
  "鈴木": ["青山龍星", "玄野武宏", "白上虎太郎"],    // 疲れた35歳男性
};

/* ── 感情検出 ── */
function detectEmotion(text: string): string {
  if (/嬉し|うれし|良かった|楽し|わくわく|できてき|うまく|喜び|前向き/.test(text)) return "happy";
  if (/ありがとう|助かり|少し安心|そうかも|なるほど|ほっ/.test(text)) return "smile";
  if (/えっ|まさか|驚|びっくり|そんな|信じ/.test(text)) return "surprised";
  if (/つら|辛い|疲れ|落ち込|しんどい|悲し|もう限界/.test(text)) return "sad";
  if (/困|悩|迷|どうすれば|うまくいかない|難し|どうしよう|わからない/.test(text)) return "worried";
  if (/怒|腹が立|嫌だ|ひどい|不満|ムカ/.test(text)) return "angry";
  return "neutral";
}

export default function SessionPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [emotion, setEmotion] = useState("idle");

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tts = useTextToSpeech();
  const sendWithTextRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    const stored = localStorage.getItem("customScenarios");
    if (stored) setCustomScenarios(JSON.parse(stored));
  }, []);

  const scenarios = [...builtInScenarios, ...customScenarios];

  const deleteCustomScenario = (id: string) => {
    const updated = customScenarios.filter((s) => s.id !== id);
    setCustomScenarios(updated);
    localStorage.setItem("customScenarios", JSON.stringify(updated));
  };

  /* チャット欄だけをスムーズスクロール（ページ全体を揺らさない） */
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  /* AIの返答が完了したら感情を検出 */
  useEffect(() => {
    if (isLoading) return;
    const lastMsg = messages.filter((m) => m.role === "assistant").at(-1)?.content ?? "";
    if (lastMsg) setEmotion(detectEmotion(lastMsg));
  }, [messages, isLoading]);

  /* ── Streaming response ── */
  const streamResponse = useCallback(
    async (msgHistory: Message[], scenario: Scenario) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgHistory, scenario }),
      });
      if (!res.body) throw new Error("レスポンスの取得に失敗しました");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let ttsBuf = "";

      setMessages([...msgHistory, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          const remaining = ttsBuf.trim();
          if (remaining) tts.pushChunk(remaining);
          break;
        }
        const chunk = decoder.decode(value);
        fullText += chunk;
        ttsBuf += chunk;
        setMessages([...msgHistory, { role: "assistant", content: fullText }]);

        while (true) {
          const match = ttsBuf.match(/^([\s\S]*?[。！？])/);
          if (!match) break;
          const sentence = match[1].trim();
          if (sentence.length >= 2) tts.pushChunk(sentence);
          ttsBuf = ttsBuf.slice(match[1].length);
        }
      }
    },
    [tts]
  );

  /* ── Send with text ── */
  const sendMessageWithText = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading || isStarting || !selectedScenario) return;
      tts.stop();
      const userMessage: Message = { role: "user", content: text.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);
      try {
        await streamResponse(newMessages, selectedScenario);
      } catch {
        setMessages([...newMessages, { role: "assistant", content: "メッセージの送信に失敗しました。もう一度お試しください。" }]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, selectedScenario, isLoading, isStarting, streamResponse, tts]
  );

  useEffect(() => { sendWithTextRef.current = sendMessageWithText; }, [sendMessageWithText]);

  const onVoiceResult = useCallback((text: string) => {
    if (text.trim()) sendWithTextRef.current(text.trim());
  }, []);
  const voice = useVoiceInput(onVoiceResult);

  /* ── Start session ── */
  const startSession = useCallback(
    async (scenario: Scenario) => {
      // キャラクターに合わせたデフォルト音声を設定
      if (tts.voiceBoxAvailable && tts.speakerStyles.length > 0) {
        const prefs = Object.entries(CHARACTER_VOICE_PREFS).find(
          ([name]) => scenario.clientName.includes(name)
        )?.[1] ?? [];
        for (const speakerName of prefs) {
          const found =
            tts.speakerStyles.find((s) => s.speakerName === speakerName && s.name === "ノーマル") ??
            tts.speakerStyles.find((s) => s.speakerName === speakerName);
          if (found) { tts.setSelectedSpeakerId(found.id); break; }
        }
      }

      setIsStarting(true);
      setSelectedScenario(scenario);
      setSessionStartTime(new Date().toISOString());
      try {
        const opening: Message[] = [{ role: "user", content: "こんにちは。今日はよろしくお願いします。まず、最近どんなことが気になっていますか？" }];
        await streamResponse(opening, scenario);
      } catch {
        setMessages([{ role: "assistant", content: "接続エラーが発生しました。ページを再読み込みしてお試しください。" }]);
      } finally {
        setIsStarting(false);
      }
    },
    [streamResponse, tts]
  );

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    sendMessageWithText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const endSession = () => {
    if (!selectedScenario || messages.length === 0) return;
    tts.stop();
    localStorage.setItem("coachingSession", JSON.stringify({
      scenario: selectedScenario, messages, startedAt: sessionStartTime, endedAt: new Date().toISOString(),
    }));
    router.push("/evaluation");
  };

  const userMsgCount = messages.filter((m) => m.role === "user").length;

  /* ══════════════════════════════
     シナリオ選択画面
  ══════════════════════════════ */
  if (!selectedScenario) {
    return (
      <main className="min-h-screen bg-[#080810]">
        {/* 背景グロー */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px]" />
        </div>

        {/* ヘッダー */}
        <div className="border-b border-white/[0.06] px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ホーム
            </Link>
            <Link href="/scenario/new" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              シナリオを作成
            </Link>
          </div>
        </div>

        <div className="relative max-w-3xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-1">コーチング練習</h1>
            <p className="text-white/30 text-sm">シナリオを選んでセッションを開始してください</p>
          </div>

          <div className="grid gap-3">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="relative group/card">
                <button
                  onClick={() => startSession(scenario)}
                  className="w-full bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-indigo-500/40 rounded-2xl p-5 text-left transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {scenario.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="text-white font-semibold">{scenario.title}</h2>
                        {scenario.isCustom && (
                          <span className="text-xs font-medium text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full">カスタム</span>
                        )}
                      </div>
                      <p className="text-white/35 text-sm truncate">{scenario.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-white/40 bg-white/5 px-2.5 py-0.5 rounded-full">{scenario.clientName}</span>
                        {scenario.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs text-indigo-400/70 bg-indigo-400/10 px-2.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-white/20 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                {scenario.isCustom && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`「${scenario.title}」を削除しますか？`)) deleteCustomScenario(scenario.id); }}
                    className="absolute top-3 right-12 w-7 h-7 rounded-lg bg-white/5 border border-white/10 text-white/20 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ══════════════════════════════
     セッション画面 — HeyGen 風 2カラムレイアウト
  ══════════════════════════════ */
  return (
    <main className="h-screen flex flex-col bg-[#080810] overflow-hidden">

      {/* ── ヘッダー（最小限） ── */}
      <div className="flex-shrink-0 border-b border-white/[0.06] bg-[#0a0a14] px-5 py-3 flex items-center justify-between">

        {/* 左：クライアント情報 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-base flex-shrink-0">
            {selectedScenario.icon}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">{selectedScenario.clientName}</p>
            <p className="text-white/35 text-xs truncate">{selectedScenario.clientRole}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/25">セッション中</span>
          </div>
        </div>

        {/* 右：コントロール */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* VoiceBox スピーカー選択 */}
          {tts.voiceBoxAvailable && tts.enabled && tts.speakerStyles.length > 0 && (
            <select
              value={tts.selectedSpeakerId}
              onChange={(e) => tts.setSelectedSpeakerId(Number(e.target.value))}
              className="text-xs text-white/50 bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1.5 outline-none focus:border-indigo-500/50 max-w-[120px]"
            >
              {tts.speakerStyles.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#1a1a2e]">
                  {s.speakerName}（{s.name}）
                </option>
              ))}
            </select>
          )}

          {/* 読み上げトグル */}
          <button
            onClick={tts.toggle}
            title={tts.enabled ? "読み上げをオフ" : "読み上げをオン"}
            className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              tts.enabled
                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                : "bg-white/[0.05] text-white/25 border border-white/[0.08] hover:text-white/50"
            }`}
          >
            {tts.speaking ? (
              <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
            ) : tts.enabled ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12M8.464 9.536a5 5 0 000 4.928" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
            {tts.voiceBoxAvailable && tts.enabled && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold" style={{ fontSize: "6px" }}>V</span>
              </span>
            )}
          </button>

          {/* 終了ボタン */}
          <button
            onClick={endSession}
            disabled={messages.length < 2}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/[0.05] text-white/50 hover:bg-red-500/15 hover:text-red-400 border border-white/[0.08] hover:border-red-500/30 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            終了
          </button>
        </div>
      </div>

      {/* ── 2カラム ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ 左パネル：アバター（常に同一DOM構造で揺れ防止） ═══ */}
        <div className="w-1/2 flex-shrink-0 flex flex-col items-center justify-center gap-4 bg-[#090912] border-r border-white/[0.06] p-6">

          {/* アバター（xl サイズ） */}
          <CharacterAvatar
            clientName={selectedScenario.clientName}
            speaking={tts.speaking && !isStarting}
            loading={(isStarting || isLoading) && !tts.speaking}
            emotion={isStarting ? "idle" : emotion}
            size="xl"
          />

          {/* 音声波形（常に存在、非表示時は点列） */}
          <SoundWave active={tts.speaking && !isStarting} />

          {/* 名前・役職 */}
          <div className="text-center">
            <p className="text-white font-semibold text-base">{selectedScenario.clientName}</p>
            <p className="text-white/40 text-sm">{selectedScenario.clientRole}</p>
          </div>

          {/* ステータス行（固定高さで揺れ防止） */}
          <div className="h-4 flex items-center justify-center">
            <p className="text-white/25 text-xs">
              {isStarting ? "セッションを準備中..." : userMsgCount > 0 ? `${userMsgCount}往復` : ""}
            </p>
          </div>
        </div>

        {/* ═══ 右パネル：チャット ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* メッセージ一覧（このコンテナ内のみスクロール） */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5">
            <div className="max-w-2xl mx-auto space-y-3">
              {messages.length === 0 && !isLoading && !isStarting && (
                <p className="text-center text-white/20 text-sm py-16">会話がここに表示されます</p>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} clientName={selectedScenario.clientName} />
              ))}
              {isLoading && <TypingIndicator clientName={selectedScenario.clientName} />}
            </div>
          </div>

          {/* ── 入力バー ── */}
          <div className="flex-shrink-0 border-t border-white/[0.06] bg-[#0a0a14] px-5 py-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-end gap-2">

                {/* 音声入力ボタン */}
                {voice.status !== "unsupported" && (
                  <button
                    onClick={voice.toggle}
                    disabled={isLoading || isStarting}
                    title={voice.status === "recording" ? "録音を停止" : "音声入力"}
                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      voice.status === "recording"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
                        : "bg-white/[0.06] text-white/35 border border-white/[0.08] hover:bg-white/10 hover:text-white/60 disabled:opacity-30"
                    }`}
                  >
                    {voice.status === "recording" ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                      </span>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* テキスト入力 */}
                <div className={`flex-1 rounded-xl border transition-all ${
                  voice.status === "recording"
                    ? "bg-red-500/5 border-red-500/30"
                    : "bg-white/[0.04] border-white/[0.08] focus-within:border-indigo-500/50 focus-within:bg-white/[0.06]"
                }`}>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      voice.status === "recording"
                        ? "🎙 聞き取り中..."
                        : "メッセージを入力（Enter で送信 / Shift+Enter で改行）"
                    }
                    rows={1}
                    className="w-full bg-transparent px-4 py-3 text-sm text-white/80 placeholder-white/20 resize-none outline-none"
                    disabled={isLoading || isStarting || voice.status === "recording"}
                  />
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || isStarting || voice.status === "recording"}
                  className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.05] disabled:text-white/15 text-white rounded-xl flex items-center justify-center transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {voice.errorMsg ? (
                <p className="text-xs text-red-400 mt-2 px-1 leading-relaxed whitespace-pre-line">{voice.errorMsg}</p>
              ) : (
                <p className="text-xs text-white/15 mt-2 px-1">
                  {voice.status === "recording"
                    ? "🎙 話し終わると自動送信されます"
                    : `コーチとして ${selectedScenario.clientName}さんをサポートしてください`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
