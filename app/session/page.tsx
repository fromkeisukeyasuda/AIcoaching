"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario } from "@/types";
import { scenarios as builtInScenarios, MIN_EVAL_USER_MESSAGES } from "@/lib/scenarios";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import CharacterAvatar from "@/components/CharacterAvatar";
import { clients } from "@/lib/coaches";
import { voiceCredit } from "@/lib/voiceCredit";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { getSettings, planOf, Plan } from "@/lib/settings";
import { avatarSrc, avatarVoicePrefs } from "@/lib/avatars";
import { track } from "@/lib/track";
import { useOralExam } from "@/hooks/useOralExam";
import { INTERVIEWER_IMAGE, INTERVIEWER_NAME } from "@/lib/oral";
import { MISSIONS, TUTORIAL_ORAL_QUESTIONS, TUTORIAL_SCENARIO_ID, saveTutorial } from "@/lib/tutorial";
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

const IN_PROGRESS_KEY = "sessionInProgress";

/** Free で練習できるシナリオ（ほかは、Pro）。田中 誠さんだけ */
const FREE_SCENARIO_IDS = ["team-management"];

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
  const [hintEnabled, setHintEnabled] = useState(false);
  const [hintParts, setHintParts] = useState<{ label: string; text: string }[] | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [hintError, setHintError] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startedRef = useRef(false); // 開始ボタンの二重タップで、セッションを2回始めない
  const tts = useTextToSpeech();
  const sendWithTextRef = useRef<(text: string) => void>(() => {});
  const oralRef = useRef<{ phase: string; submitAnswer: (t: string) => void } | null>(null);

  const [plan, setPlan] = useState<Plan>("free");
  const [lockedNote, setLockedNote] = useState<string | null>(null);   // Free で、Pro のものを押したときの案内
  useEffect(() => {
    setHintEnabled(getSettings().hint);
    setPlan(planOf(getSettings().historyView));
  }, []);

  /* 練習の途中の状態を、タブを閉じるまで、保持する（ほかのタブへ移って戻っても、続きから） */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(IN_PROGRESS_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { scenario: Scenario; messages: Message[]; startedAt: string };
      if (!saved?.scenario || !Array.isArray(saved.messages) || saved.messages.length === 0) return;
      // チュートリアルとして開いたときは、チュートリアルの面談だけを復元する（別の練習の途中は、使わない）
      if (new URLSearchParams(window.location.search).get("tutorial") && saved.scenario.id !== TUTORIAL_SCENARIO_ID) { sessionStorage.removeItem(IN_PROGRESS_KEY); return; }
      startedRef.current = true;
      setSelectedScenario(saved.scenario);
      setMessages(saved.messages);
      setSessionStartTime(saved.startedAt);
      const prefs = avatarVoicePrefs(saved.scenario.avatar).length > 0
        ? avatarVoicePrefs(saved.scenario.avatar)
        : Object.entries(CHARACTER_VOICE_PREFS).find(([name]) => saved.scenario.clientName.includes(name))?.[1] ?? [];
      tts.setVoicePrefs(prefs);
    } catch { /* 復元できなければ、最初から */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 返答が終わるたびに、保存する（返答の途中は、保存しない） */
  useEffect(() => {
    if (!selectedScenario || !sessionStartTime || isLoading || isStarting || messages.length === 0) return;
    if (messages[messages.length - 1].content === "") return;
    try {
      sessionStorage.setItem(IN_PROGRESS_KEY, JSON.stringify({ scenario: selectedScenario, messages, startedAt: sessionStartTime }));
    } catch { /* 保存できなくても、練習は続けられる */ }
  }, [selectedScenario, sessionStartTime, messages, isLoading, isStarting]);

  /* 会話が進んだら、前のヒントは消す */
  useEffect(() => {
    setHintParts(null);
    setHintError(null);
  }, [messages.length]);

  const requestHint = async () => {
    if (!selectedScenario || hintLoading || messages.length === 0) return;
    setHintLoading(true);
    setHintError(null);
    try {
      const res = await fetch("/api/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, scenario: selectedScenario }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.parts)) throw new Error(data.error || "ヒントを作れませんでした。");
      setHintParts(data.parts);
    } catch (e) {
      setHintError(e instanceof Error ? e.message : "ヒントを作れませんでした。");
    } finally {
      setHintLoading(false);
    }
  };

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

  /* 新しいメッセージが来たら下へスムーズスクロール */
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, hintParts, hintError]);

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
      let spokeFirst = false; // 最初の1文は、長いとき、読点で区切って、早く声を出し始める

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
            if (!match) {
              const early = spokeFirst ? null : ttsBuf.match(/^([\s\S]{10,}?、)/);
              if (early) {
                tts.pushChunk(early[1].trim());
                spokeFirst = true;
                ttsBuf = ttsBuf.slice(early[1].length);
                continue;
              }
              break;
            }
            const sentence = match[1].trim();
            if (sentence.length >= 2) { tts.pushChunk(sentence); spokeFirst = true; }
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
      // 口頭試問の最中は、入力が、面接官への答えになる
      if (oralRef.current?.phase === "oral") { oralRef.current.submitAnswer(text); return; }
      if (!text.trim() || isLoading || isStarting || !selectedScenario) return;
      tts.unlock();
      track("turn", "practice");
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

  /* 音声認識結果 → 話し終えて（無音が続いて）から400msで自動送信 */
  const onVoiceResult = useCallback((text: string) => {
    if (!text.trim()) return;
    setInput(text.trim());
    setTimeout(() => {
      setInput("");
      sendWithTextRef.current(text.trim());
    }, 400);
  }, []);
  const onVoiceInterim = useCallback((text: string) => {
    setInput(text); // 話している途中の結果を、入力欄に出す
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    });
  }, []);
  const voice = useVoiceInput(onVoiceResult, onVoiceInterim);

  /* ── Start session ── */
  const startSession = useCallback(
    async (scenario: Scenario) => {
      if (startedRef.current) return;
      startedRef.current = true;
      tts.unlock(); // タップの中で、スマホの自動再生の制限を解除しておく
      track("session", "practice");
      // 作成時に選んだ見た目があれば、その声を優先する（VoiceBox の確認前でも、確認後に反映される）
      const prefs = avatarVoicePrefs(scenario.avatar).length > 0
        ? avatarVoicePrefs(scenario.avatar)
        : Object.entries(CHARACTER_VOICE_PREFS).find(([name]) => scenario.clientName.includes(name))?.[1] ?? [];
      tts.setVoicePrefs(prefs);

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

  /* ── チュートリアル: ?tutorial=1 で開いたら、佐藤さんの面談を自動で始め、ミッションを1つずつ出す ── */
  const [tutorial, setTutorial] = useState(false);
  const [ttsWaited, setTtsWaited] = useState(false);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).get("tutorial")) return;
    setTutorial(true);
    const timer = setTimeout(() => setTtsWaited(true), 6000); // 声の準備が遅くても、6秒で始める
    return () => clearTimeout(timer);
  }, []);
  /* 声の準備（VOICEVOXの確認）が終わってから始める。ほかのモードと同じ声で、最初の一言から読み上げるため */
  useEffect(() => {
    if (!tutorial || startedRef.current || !(tts.checked || ttsWaited)) return;
    const scenario = builtInScenarios.find((s) => s.id === TUTORIAL_SCENARIO_ID);
    if (scenario) startSession(scenario);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorial, tts.checked, ttsWaited]);
  /* チュートリアルの面談の ID（開始時刻）を覚えておく。評価のあと、結果の画面へ進めるため */
  useEffect(() => {
    if (tutorial && sessionStartTime) saveTutorial({ step: "practice", session: sessionStartTime });
  }, [tutorial, sessionStartTime]);

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

  /** 口頭試問を受けない終了（これまでどおり。評価の待ち画面へ） */
  const endWithoutOral = () => {
    if (!selectedScenario || messages.length === 0) return;
    tts.stop();
    try { sessionStorage.removeItem(IN_PROGRESS_KEY); } catch { /* noop */ }
    localStorage.setItem("coachingSession", JSON.stringify({
      scenario: selectedScenario, messages, startedAt: sessionStartTime, endedAt: new Date().toISOString(),
    }));
    router.push("/evaluation");
  };

  const userMsgCount = messages.filter((m) => m.role === "user").length;
  const spoken = Math.max(0, userMsgCount - 1); // 面談の最初に自動で送る、あいさつの分を除いた、あなたの発言の数

  /* 終了後の、口頭試問と面接官評価（「はい」を選んだとき） */
  const oral = useOralExam({ tts, scenario: selectedScenario, messages, startedAt: sessionStartTime, onSkip: endWithoutOral, questionCount: tutorial ? TUTORIAL_ORAL_QUESTIONS : undefined });
  oralRef.current = oral;
  const inOral = oral.phase === "oral" || oral.phase === "finishing" || oral.phase === "result";
  const locked = isLoading || isStarting || oral.phase === "finishing" || oral.phase === "result";
  const shownMessages = inOral ? oral.dialog : messages;

  /* 評価に必要な会話があるときだけ、口頭試問を勧める。足りないときは、これまでどおり */
  const onEndClick = () => {
    if (tutorial) { if (userMsgCount >= MIN_EVAL_USER_MESSAGES) oral.accept(); return; } // チュートリアルは、確認なしで、口頭試問へ
    if (userMsgCount >= MIN_EVAL_USER_MESSAGES) oral.openConfirm();
    else endWithoutOral();
  };

  /* 口頭試問の評価まで終わったら、途中の保存は、いらない（口頭試問の途中は、練習の終わりから、やり直す） */
  useEffect(() => {
    if (oral.phase === "result") { try { sessionStorage.removeItem(IN_PROGRESS_KEY); } catch { /* noop */ } }
  }, [oral.phase]);

  /* 口頭試問の会話が増えたら、下へスクロール */
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [oral.dialog, oral.phase]);
  const voiceName = tts.speakerStyles.find((s) => s.id === tts.selectedSpeakerId)?.speakerName;

  /* ══════════════════════════════
     シナリオ選択画面
  ══════════════════════════════ */
  if (!selectedScenario) {
    return (
      <main className="fit-page fit-scroll px-5 sm:px-8 pb-10 pt-4 sm:pt-5">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col">

          {/* ヘッダー（1行にまとめて、カードを画面内に収める） */}
          <div className="reveal flex min-h-[44px] md:h-11 flex-wrap items-center justify-between gap-x-6 gap-y-3" style={{ ["--i" as string]: 0 }}>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              <span className="text-grad">誰の相談を、聴く？</span>
            </h1>
            <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
              {plan === "free" ? (
                <button
                  type="button"
                  onClick={() => setLockedNote("create")}
                  className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/55"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)" }}
                >
                  シナリオを作成
                  <span className="text-[12px] font-bold text-pink-200/90">🔒 Pro</span>
                </button>
              ) : (
                <Link href="/scenario/new" className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/80" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16)" }}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  シナリオを作成
                </Link>
              )}
            </div>
          </div>

          {lockedNote && (
            <p className="mt-3 text-[13px] leading-relaxed text-pink-200">
              {lockedNote === "create" ? "シナリオの作成は、Pro で利用できます。" : "Free で練習できるのは、田中 誠さんです。佐藤さん・鈴木さんは、Pro で練習できます。"}
            </p>
          )}

          {/* 相談者カード（PCでは画面の高さいっぱいに収める） */}
          <div className="fit-rows mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {scenarios.map((scenario, idx) => {
              const portrait = clients.find((c) => c.scenarioId === scenario.id)?.images?.idle ?? avatarSrc(scenario.avatar);
              const locked = plan === "free" && !scenario.isCustom && !FREE_SCENARIO_IDS.includes(scenario.id);
              return (
                <div key={scenario.id} className="reveal group/card relative min-h-0" style={{ ["--i" as string]: idx + 1 }}>
                  <button
                    onClick={() => (locked ? setLockedNote(scenario.id) : startSession(scenario))}
                    aria-disabled={locked}
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
                      {locked && (
                        <>
                          <div className="absolute inset-0 bg-[#14121f]/45" />
                          <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-pink-200 backdrop-blur">
                            🔒 Pro
                          </div>
                        </>
                      )}
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
            <p className="text-white text-sm font-semibold leading-tight truncate">{inOral ? INTERVIEWER_NAME : selectedScenario.clientName}</p>
            <p className="text-white/45 text-xs truncate">{inOral ? (oral.phase === "result" ? "面接官評価" : `口頭試問（${Math.min(oral.step + 1, oral.total)} / ${oral.total}）`) : selectedScenario.clientRole}</p>
          </div>
          <div className="flex items-center gap-1.5 ml-1 flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-white/45">{oral.phase === "result" ? "評価" : inOral ? "口頭試問中" : "セッション中"}</span>
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

          {/* 終了ボタン（口頭試問の最中は、「やめる」） */}
          {inOral ? (
            oral.phase === "oral" && (
              <button
                onClick={oral.cancel}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/60 hover:bg-red-400/10 hover:text-red-300 border border-white/10 hover:border-red-300/40 transition-all"
              >
                やめる
              </button>
            )
          ) : (
            <button
              onClick={onEndClick}
              disabled={messages.length === 0 || isStarting || isLoading}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 text-white/60 hover:bg-red-400/10 hover:text-red-300 border border-white/10 hover:border-red-300/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              終了
            </button>
          )}
        </div>
      </div>

      {/* ── チュートリアルのミッション。あなたが1回話すたびに、次のミッションへ進む ── */}
      {tutorial && !inOral && (
        <div className="flex-shrink-0 border-b border-pink-300/20 bg-pink-400/10 px-4 py-2.5 md:px-5">
          {spoken < MISSIONS.length ? (
            <div className="min-w-0">
              <p className="tnum text-[10.5px] font-bold text-pink-200">ミッション {spoken + 1} / {MISSIONS.length}</p>
              <p className="text-[14px] font-extrabold leading-snug text-white">{MISSIONS[spoken].title}</p>
              <p className="hidden text-[12px] leading-snug text-white/70 sm:block">{MISSIONS[spoken].detail}</p>
              <p className="mt-0.5 text-[12px] leading-snug text-pink-100/90">例）{MISSIONS[spoken].example}</p>
            </div>
          ) : (
            <p className="text-[13px] font-bold leading-snug text-white">ミッション完了です。右上の「終了」を押して、口頭試問へ進みましょう。</p>
          )}
        </div>
      )}

      {/* ── 2カラム ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

        {/* ═══ 左パネル：アバター（ダークネイビー — コーチング集中空間） ═══ */}
        <div className="w-full h-[24%] min-h-[120px] md:min-h-0 md:h-auto md:w-1/2 flex-shrink-0 flex flex-col bg-[#0f0d1a] overflow-hidden">

          {/* 画像エリア */}
          <div className="flex-1 min-h-0 p-2 pb-1 md:p-4 md:pb-2">
            <CharacterAvatar
              clientName={inOral ? INTERVIEWER_NAME : selectedScenario.clientName}
              speaking={tts.speaking && !isStarting}
              loading={(isStarting || isLoading || oral.phase === "finishing") && !tts.speaking}
              emotion={isStarting ? "idle" : emotion}
              size="fill"
              avatarId={inOral ? undefined : selectedScenario.avatar}
              imageSrc={inOral ? INTERVIEWER_IMAGE : undefined}
            />
          </div>

          {/* 下部バー: 音声波形 + ステータス */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 md:gap-1.5 pb-2 md:pb-3 px-4">
            <div className="hidden md:block"><SoundWave active={tts.speaking && !isStarting} /></div>
            {tts.voiceBoxAvailable && tts.enabled && voiceName && (
              <p className="text-[10px] text-white/45">{voiceCredit(voiceName)}</p>
            )}
            <div className={`h-4 items-center justify-center ${isStarting ? "flex" : "hidden md:flex"}`}>
              <p className="text-white/35 text-xs">
                {isStarting ? "セッションを準備中..." : inOral ? "" : userMsgCount > 0 ? `${userMsgCount}往復` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* ═══ 右パネル：チャット ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#14121f]">

          {/* メッセージ一覧 */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto scrollbar-hide px-5 py-5">
            <div className="max-w-2xl mx-auto space-y-3">
              {shownMessages.length === 0 && !isLoading && !isStarting && (
                <p className="text-center text-white/45 text-sm py-16">会話がここに表示されます</p>
              )}
              {shownMessages.map((msg, i) => (
                <ChatMessage key={i} message={msg} clientName={inOral ? INTERVIEWER_NAME : selectedScenario.clientName} />
              ))}
              {(isLoading || oral.phase === "finishing") && <TypingIndicator clientName={inOral ? INTERVIEWER_NAME : selectedScenario.clientName} />}
              {oral.phase === "finishing" && (
                <p className="text-center text-xs text-white/50">面接官が、評価をまとめています。1分ほどかかります…</p>
              )}
              {oral.phase === "result" && oral.result && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center">
                  <p className="text-[11px] font-bold text-white/45">面接官評価（総合）</p>
                  <p className="mt-1 text-4xl font-extrabold text-white">{oral.result.overall}<span className="ml-1 text-sm font-medium text-white/45">/ 100点</span></p>
                  <button
                    onClick={oral.review}
                    disabled={!oral.ready}
                    className="mt-3 w-full rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-white/90 disabled:opacity-50"
                  >
                    {oral.ready ? "振り返りシートを見る" : "振り返りシートを準備中…"}
                  </button>
                  <p className="mt-2 text-[11px] text-white/45">問ごとの点数と講評は、振り返りシートに出ます。</p>
                </div>
              )}
              {!inOral && (hintParts || hintError) && (
                <div className="relative rounded-xl border border-amber-300/30 bg-amber-400/10 py-3 pl-4 pr-8 text-[12.5px] leading-[1.35] text-amber-100">
                  <button onClick={() => { setHintParts(null); setHintError(null); }} className="absolute right-2.5 top-2 text-xs text-white/50 hover:text-white" aria-label="ヒントを閉じる">✕</button>
                  {hintParts ? (
                    <ul className="space-y-1">
                      {hintParts.map((p) => (
                        <li key={p.label} className="flex gap-2">
                          <span className="w-[4.6em] flex-shrink-0 whitespace-nowrap pt-px text-[11px] font-bold leading-[1.45] text-amber-300">{p.label}</span>
                          <span className="min-w-0 flex-1">{p.text}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-red-300">{hintError}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── 入力バー ── */}
          <div className={`flex-shrink-0 border-t border-white/10 bg-[#1d1a2e] px-4 py-3 md:px-5 md:py-4 ${oral.phase === "result" ? "hidden" : ""}`}>
            <div className="max-w-2xl mx-auto">
              <div className="flex items-end gap-2">

                {/* ヒントボタン（マイページで、オンのとき） */}
                {hintEnabled && !inOral && (
                  <button
                    onClick={requestHint}
                    disabled={isLoading || isStarting || hintLoading || messages.length < 2}
                    title="次の一手のヒントを見る"
                    aria-label="ヒントを見る"
                    className="flex-shrink-0 w-[46px] h-[46px] rounded-xl flex items-center justify-center bg-white/10 text-xl border border-white/10 hover:bg-amber-400/20 disabled:opacity-30 transition-all"
                  >
                    {hintLoading ? <span className="text-base animate-pulse">…</span> : "💡"}
                  </button>
                )}

                {/* テキスト入力 */}
                <div className={`flex flex-1 items-end rounded-xl border transition-colors [-webkit-tap-highlight-color:transparent] ${
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
                        : inOral ? "面接官への答えを入力" : "メッセージを入力"
                    }
                    rows={1}
                    className="min-w-0 flex-1 bg-transparent px-4 py-[10px] text-base leading-6 text-white/90 placeholder-white/35 resize-none outline-none focus-visible:outline-none [-webkit-tap-highlight-color:transparent] md:py-3 md:text-sm md:leading-5"
                    disabled={locked || voice.status === "recording"}
                  />
                  {/* 音声入力ボタン（入力ボックスの右端） */}
                  {voice.status !== "unsupported" && (
                    <button
                      onClick={() => { tts.stop(); voice.toggle(); }}
                      disabled={locked}
                      title={voice.status === "recording" ? "録音を停止" : "音声入力"}
                      aria-label={voice.status === "recording" ? "録音を停止" : "音声入力"}
                      className={`mb-1 mr-1 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        voice.status === "recording"
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/30"
                          : "text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-30"
                      }`}
                    >
                      {voice.status === "recording" ? (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                        </span>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                {/* 送信ボタン */}
                <button
                  onClick={voice.status === "recording" && voice.manualMode ? voice.finish : sendMessage}
                  disabled={!input.trim() || locked || (voice.status === "recording" && !voice.manualMode)}
                  className="flex-shrink-0 w-[46px] h-[46px] disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl flex items-center justify-center transition-all shadow-sm"
                  style={{ background: !input.trim() || locked || (voice.status === "recording" && !voice.manualMode) ? undefined : "linear-gradient(135deg, #F472B6 0%, #D946EF 100%)" }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {voice.errorMsg ? (
                <p className="text-xs text-red-300 mt-2 px-1 leading-relaxed whitespace-pre-line">{voice.errorMsg}</p>
              ) : (
                <p className={`text-xs text-white/45 mt-2 px-1 ${voice.status === "recording" ? "" : "hidden md:block"}`}>
                  {voice.status === "recording"
                    ? voice.manualMode ? "🎙 話し終わったら、送信ボタンを押してください" : "🎙 話し終わると自動送信されます"
                    : inOral
                    ? "面接官の質問に、答えを入力するか、マイクで話してください ・ Enter で送信 / Shift+Enter で改行"
                    : `コーチとして ${selectedScenario.clientName}さんをサポートしてください ・ Enter で送信 / Shift+Enter で改行`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 口頭試問を受けるかの確認 ── */}
      {oral.phase === "confirm" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6" role="dialog" aria-modal="true" aria-labelledby="oral-title">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1d1a2e] p-6 shadow-2xl">
            <p id="oral-title" className="text-base font-bold text-white">口頭試問と面接官評価をもらいますか？</p>
            <p className="mt-2 text-xs leading-relaxed text-white/55">
              「はい」を選ぶと、面接官が、5つの質問をします。答えたあとに、面接官からの評価が届きます。
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={oral.decline} className="flex-1 rounded-xl bg-white/10 py-3 text-sm font-semibold text-white/80 hover:bg-white/15">
                いいえ
              </button>
              <button onClick={oral.accept} className="flex-1 rounded-xl bg-white py-3 text-sm font-bold text-black hover:bg-white/90">
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
