"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario, SessionRecord } from "@/types";
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
          <div key={i} className="w-0.5 h-0.5 rounded-full bg-white/15" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center gap-0.5 h-6">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-0.5 rounded-full bg-blue-400"
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
  "田中": ["玄野武宏", "白上虎太郎", "青山龍星"],
  "佐藤": ["春日部つむぎ", "四国めたん", "九州そら"],
  "鈴木": ["青山龍星", "玄野武宏", "白上虎太郎"],
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
  const [levelUpItems, setLevelUpItems] = useState<string[]>([]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tts = useTextToSpeech();
  const sendWithTextRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    const stored = localStorage.getItem("customScenarios");
    if (stored) setCustomScenarios(JSON.parse(stored));
  }, []);

  /* 前回セッションの改善点をレベルアップ目標として読み込む */
  useEffect(() => {
    const raw = localStorage.getItem("sessionHistory");
    if (raw) {
      const history: SessionRecord[] = JSON.parse(raw);
      if (history.length > 0) {
        const items = history[0].evaluation.improvements.slice(0, 3);
        setLevelUpItems(items);
      }
    }
  }, []);

  const scenarios = [...builtInScenarios, ...customScenarios];

  const deleteCustomScenario = (id: string) => {
    const updated = customScenarios.filter((s) => s.id !== id);
    setCustomScenarios(updated);
    localStorage.setItem("customScenarios", JSON.stringify(updated));
  };

  /* 新しいメッセージが来たら下へスムーズスクロール */
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
          // エラー応答を検知してユーザーフレンドリーなメッセージに変換
          if (fullText.startsWith("[ERROR]:")) {
            setMessages([...msgHistory, {
              role: "assistant",
              content: "申し訳ありません、現在 AI に接続できません。APIクレジットをご確認いただくか、しばらくしてから再度お試しください。",
            }]);
            return;
          }
          const remaining = ttsBuf.trim();
          if (remaining) tts.pushChunk(remaining);
          break;
        }
        const chunk = decoder.decode(value);
        fullText += chunk;
        ttsBuf += chunk;
        // エラーが確定する前は暫定テキストとして表示しない
        if (!fullText.startsWith("[ERROR]:")) {
          setMessages([...msgHistory, { role: "assistant", content: fullText }]);
          while (true) {
            const match = ttsBuf.match(/^([\s\S]*?[。！？])/);
            if (!match) break;
            const sentence = match[1].trim();
            if (sentence.length >= 2) tts.pushChunk(sentence);
            ttsBuf = ttsBuf.slice(match[1].length);
          }
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

  /* 音声認識結果 → 認識完了後400msで自動送信 */
  const onVoiceResult = useCallback((text: string) => {
    if (!text.trim()) return;
    setInput(text.trim());
    setTimeout(() => {
      setInput("");
      sendWithTextRef.current(text.trim());
    }, 400);
  }, []);
  const voice = useVoiceInput(onVoiceResult);

  /* ── Start session ── */
  const startSession = useCallback(
    async (scenario: Scenario) => {
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
      <main className="min-h-screen bg-slate-50">

        {/* ヘッダー */}
        <div className="bg-white border-b border-slate-200 shadow-sm px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ホーム
            </Link>
            <Link href="/scenario/new" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white text-xs font-medium rounded-lg transition-colors shadow-sm" style={{ background: "#1C2B4A" }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              シナリオを作成
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">コーチング練習</h1>
            <p className="text-slate-400 text-sm">シナリオを選んでセッションを開始してください</p>
          </div>

          <div className="grid gap-3">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="relative group/card">
                <button
                  onClick={() => startSession(scenario)}
                  className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left transition-all duration-200 group shadow-sm hover:shadow-md"
                  style={{ ["--tw-border-opacity" as string]: "1" }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "#1C2B4A")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {scenario.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="text-slate-800 font-semibold">{scenario.title}</h2>
                        {scenario.isCustom && (
                          <span className="text-xs font-medium text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">カスタム</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm truncate">{scenario.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{scenario.clientName}</span>
                        {scenario.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                {scenario.isCustom && (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm(`「${scenario.title}」を削除しますか？`)) deleteCustomScenario(scenario.id); }}
                    className="absolute top-3 right-12 w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all"
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
    <main className="h-screen flex flex-col bg-white overflow-hidden">

      {/* ── ヘッダー ── */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white px-5 py-3 flex items-center justify-between shadow-sm">

        {/* 左：クライアント情報 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-base flex-shrink-0">
            {selectedScenario.icon}
          </div>
          <div className="min-w-0">
            <p className="text-slate-800 text-sm font-semibold leading-tight truncate">{selectedScenario.clientName}</p>
            <p className="text-slate-400 text-xs truncate">{selectedScenario.clientRole}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-slate-400">セッション中</span>
          </div>
        </div>

        {/* 右：コントロール */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* VoiceBox スピーカー選択 */}
          {tts.voiceBoxAvailable && tts.enabled && tts.speakerStyles.length > 0 && (
            <select
              value={tts.selectedSpeakerId}
              onChange={(e) => tts.setSelectedSpeakerId(Number(e.target.value))}
              className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-blue-400 max-w-[120px]"
            >
              {tts.speakerStyles.map((s) => (
                <option key={s.id} value={s.id} className="bg-white">
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
                ? "bg-blue-50 text-blue-600 border border-blue-300"
                : "bg-slate-100 text-slate-400 border border-slate-200 hover:text-slate-600"
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
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            終了
          </button>
        </div>
      </div>

      {/* ── 2カラム ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ 左パネル：アバター（ダークネイビー — コーチング集中空間） ═══ */}
        <div className="w-1/2 flex-shrink-0 flex flex-col bg-[#0d1b2e] overflow-hidden">

          {/* 画像エリア */}
          <div className="flex-1 min-h-0 p-4 pb-2">
            <CharacterAvatar
              clientName={selectedScenario.clientName}
              speaking={tts.speaking && !isStarting}
              loading={(isStarting || isLoading) && !tts.speaking}
              emotion={isStarting ? "idle" : emotion}
              size="fill"
            />
          </div>

          {/* 下部バー: 音声波形 + ステータス */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pb-3 px-4">
            <SoundWave active={tts.speaking && !isStarting} />
            <div className="h-4 flex items-center justify-center">
              <p className="text-white/35 text-xs">
                {isStarting ? "セッションを準備中..." : userMsgCount > 0 ? `${userMsgCount}往復` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ 右パネル：チャット ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

          {/* メッセージ一覧 */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5">
            <div className="max-w-2xl mx-auto space-y-3">
              {messages.length === 0 && !isLoading && !isStarting && (
                <p className="text-center text-slate-400 text-sm py-16">会話がここに表示されます</p>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} clientName={selectedScenario.clientName} />
              ))}
              {isLoading && <TypingIndicator clientName={selectedScenario.clientName} />}
            </div>
          </div>

          {/* ── レベルアップ目標（前回セッションの改善点） ── */}
          {levelUpItems.length > 0 && (
            <div className="flex-shrink-0 bg-amber-50 border-t border-amber-200 px-5 py-2.5">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-bold text-amber-700 flex-shrink-0 mt-0.5 flex items-center gap-1">
                    🎯 レベルアップ目標
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {levelUpItems.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full leading-relaxed"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 入力バー ── */}
          <div className="flex-shrink-0 border-t border-slate-200 bg-white px-5 py-4">
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
                        : "bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30"
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
                    ? "bg-red-50 border-red-300"
                    : "bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:bg-white"
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
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-none outline-none"
                    disabled={isLoading || isStarting || voice.status === "recording"}
                  />
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || isStarting || voice.status === "recording"}
                  className="flex-shrink-0 w-10 h-10 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                  style={{ background: !input.trim() || isLoading || isStarting || voice.status === "recording" ? undefined : "#1C2B4A" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {voice.errorMsg ? (
                <p className="text-xs text-red-500 mt-2 px-1 leading-relaxed whitespace-pre-line">{voice.errorMsg}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-2 px-1">
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
