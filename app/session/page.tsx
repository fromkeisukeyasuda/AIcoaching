"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario, SessionRecord } from "@/types";
import { scenarios as builtInScenarios } from "@/lib/scenarios";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import CharacterAvatar from "@/components/CharacterAvatar";
import { clients } from "@/lib/coaches";
import { Counseling, addCounselingXp, getCounseling, xpNeeded, XP_PER_COACH_MESSAGE } from "@/lib/talkStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

/* ── カウンセリングLv（面談練習でコーチ役として話すほど上がる） ── */
function LevelBar({ c, flash = false }: { c: Counseling; flash?: boolean }) {
  const pct = Math.min(100, (c.xp / xpNeeded(c.lv)) * 100);
  return (
    <div className={`flex w-full items-center gap-3 rounded-full bg-white/[0.06] px-4 py-2 text-xs transition-shadow ${flash ? "ring-2 ring-pink-300" : ""}`}>
      <span className="tnum whitespace-nowrap font-bold text-pink-200">カウンセリング Lv.{c.lv}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="tnum whitespace-nowrap text-white/45">{c.xp}/{xpNeeded(c.lv)}</span>
    </div>
  );
}

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
          className="w-0.5 rounded-full bg-pink-400"
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
  "田中": ["離途", "玄野武宏", "白上虎太郎"],
  "佐藤": ["四国めたん", "春日部つむぎ", "九州そら"],
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
  const [counseling, setCounseling] = useState<Counseling>({ lv: 1, xp: 0 });
  const [levelFlash, setLevelFlash] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tts = useTextToSpeech();
  const sendWithTextRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    setCounseling(getCounseling());
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
      /* コーチ役として話すたびに経験値 */
      const { state, leveledUp } = addCounselingXp(XP_PER_COACH_MESSAGE);
      setCounseling(state);
      if (leveledUp) {
        setLevelFlash(true);
        setTimeout(() => setLevelFlash(false), 2500);
      }
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
      <main className="fit-page px-5 sm:px-8 pb-10 pt-4 sm:pt-5">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col md:min-h-0 md:flex-1">

          {/* ヘッダー（1行にまとめて、カードを画面内に収める） */}
          <div className="reveal flex min-h-[44px] md:h-11 flex-wrap items-center justify-between gap-x-6 gap-y-3" style={{ ["--i" as string]: 0 }}>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              <span className="text-grad">誰の相談を、聴く？</span>
            </h1>
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              <div className="min-w-[240px] flex-1 md:w-[280px] md:flex-none"><LevelBar c={counseling} /></div>
              <Link href="/scenario/new" className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/80" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)" }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                シナリオを作成
              </Link>
            </div>
          </div>

          {/* 相談者カード（PCでは画面の高さいっぱいに収める） */}
          <div className="fit-grid mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-[minmax(0,1fr)] md:gap-5">
            {scenarios.map((scenario, idx) => {
              const portrait = clients.find((c) => c.scenarioId === scenario.id)?.images?.idle ?? null;
              return (
                <div key={scenario.id} className="reveal group/card relative min-h-0" style={{ ["--i" as string]: idx + 1 }}>
                  <button
                    onClick={() => startSession(scenario)}
                    className="glass lift group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[28px] text-left"
                  >
                    <div className="relative aspect-[4/4.2] w-full overflow-hidden md:aspect-auto md:min-h-0 md:flex-1">
                      {portrait ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={portrait} alt={`${scenario.clientName}さん`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" style={{ objectPosition: "50% 15%" }} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-7xl" style={{ background: "radial-gradient(closest-side, rgba(217,70,239,0.3), transparent 80%)" }}>
                          {scenario.icon}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#14121f] via-[#14121f]/60 to-transparent" />
                      <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-lg shadow-fuchsia-500/30">
                        {scenario.title}
                      </div>
                      <div className="absolute inset-x-5 bottom-3">
                        <p className="text-2xl font-extrabold tracking-tight">{scenario.clientName}</p>
                        <p className="mt-0.5 text-xs text-white/65">{scenario.clientRole}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 p-5 pt-4">
                      <p className="line-clamp-2 text-[13px] leading-relaxed text-white/60">{scenario.description}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {scenario.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-md bg-white/[0.07] px-2 py-1 text-[11px] font-medium text-white/65">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </button>
                  {scenario.isCustom && (
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`「${scenario.title}」を削除しますか？`)) deleteCustomScenario(scenario.id); }}
                      aria-label="シナリオを削除"
                      className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/70 opacity-0 backdrop-blur transition-all hover:bg-red-500/70 hover:text-white group-hover/card:opacity-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  /* ══════════════════════════════
     セッション画面 — HeyGen 風 2カラムレイアウト
  ══════════════════════════════ */
  return (
    <main className="screen-h flex flex-col bg-[#1d1a2e] overflow-hidden">

      {/* ── ヘッダー ── */}
      <div className="flex-shrink-0 border-b border-white/10 bg-[#1d1a2e] px-5 py-3 flex items-center justify-between shadow-sm">

        {/* 左：クライアント情報 */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">{selectedScenario.clientName}</p>
            <p className="text-white/45 text-xs truncate">{selectedScenario.clientRole}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/45">セッション中</span>
          </div>
        </div>

        {/* 右：コントロール */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* 読み上げトグル */}
          <button
            onClick={tts.toggle}
            title={tts.enabled ? "読み上げをオフ" : "読み上げをオン"}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              tts.enabled
                ? "bg-pink-400/15 text-pink-300 border border-pink-300/50"
                : "bg-white/10 text-white/45 border border-white/10 hover:text-white"
            }`}
          >
            <svg className={`w-4 h-4 ${tts.speaking ? "animate-pulse" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              {tts.enabled ? (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728" />
                </>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              )}
            </svg>
          </button>

          {/* 終了ボタン */}
          <button
            onClick={endSession}
            disabled={messages.length < 2}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/60 hover:bg-red-400/10 hover:text-red-300 border border-white/10 hover:border-red-300/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            終了
          </button>
        </div>
      </div>

      {/* ── 2カラム ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ═══ 左パネル：アバター（ダークネイビー — コーチング集中空間） ═══ */}
        <div className="w-full h-[34%] md:h-auto md:w-1/2 flex-shrink-0 flex flex-col bg-[#0f0d1a] overflow-hidden">

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
            <LevelBar c={counseling} flash={levelFlash} />
            {levelFlash && <p className="text-center text-xs text-pink-200">レベルアップ。カウンセリング Lv.{counseling.lv}</p>}
            <div className="h-4 flex items-center justify-center">
              <p className="text-white/35 text-xs">
                {isStarting ? "セッションを準備中..." : userMsgCount > 0 ? `${userMsgCount}往復` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ 右パネル：チャット ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#14121f]">

          {/* メッセージ一覧 */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5">
            <div className="max-w-2xl mx-auto space-y-3">
              {messages.length === 0 && !isLoading && !isStarting && (
                <p className="text-center text-white/45 text-sm py-16">会話がここに表示されます</p>
              )}
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} clientName={selectedScenario.clientName} />
              ))}
              {isLoading && <TypingIndicator clientName={selectedScenario.clientName} />}
            </div>
          </div>

          {/* ── レベルアップ目標（前回セッションの改善点） ── */}
          {levelUpItems.length > 0 && (
            <div className="flex-shrink-0 bg-amber-400/10 border-t border-amber-300/30 px-5 py-2.5">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-bold text-amber-200 flex-shrink-0 mt-0.5 flex items-center gap-1">
                    🎯 レベルアップ目標
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {levelUpItems.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs text-amber-200 bg-amber-400/20 border border-amber-300/30 px-2.5 py-0.5 rounded-full leading-relaxed"
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
          <div className="flex-shrink-0 border-t border-white/10 bg-[#1d1a2e] px-5 py-4">
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
                        : "bg-white/10 text-white/45 border border-white/10 hover:bg-white/20 hover:text-white disabled:opacity-30"
                    }`}
                  >
                    {voice.status === "recording" ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1d1a2e] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1d1a2e]" />
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
                    ? "bg-red-400/10 border-red-300/40"
                    : "bg-[#14121f] border-white/10 focus-within:border-pink-300 focus-within:bg-[#241f3a]"
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
                    className="w-full bg-transparent px-4 py-3 text-sm text-white/90 placeholder-white/35 resize-none outline-none"
                    disabled={isLoading || isStarting || voice.status === "recording"}
                  />
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading || isStarting || voice.status === "recording"}
                  className="flex-shrink-0 w-10 h-10 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                  style={{ background: !input.trim() || isLoading || isStarting || voice.status === "recording" ? undefined : "linear-gradient(135deg, #F472B6 0%, #D946EF 100%)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {voice.errorMsg ? (
                <p className="text-xs text-red-300 mt-2 px-1 leading-relaxed whitespace-pre-line">{voice.errorMsg}</p>
              ) : (
                <p className="text-xs text-white/45 mt-2 px-1">
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
