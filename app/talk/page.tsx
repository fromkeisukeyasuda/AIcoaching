"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Message } from "@/types";
import { Coach, CoachEmotion, coaches, portraitOf, EMOTION_TAG_RE } from "@/lib/coaches";
import { TalkProfile, getProfile, saveProfile } from "@/lib/talkStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

const AGE_GROUPS = ["10代", "20代", "30代", "40代", "50代", "60代以上"];
const MAX_STORED = 60;
const VALID_EMOTIONS: CoachEmotion[] = ["neutral", "smile", "happy", "worried", "sad", "surprised"];

/* ストリーム途中の文字列から [表情: xxx] タグを分離する */
function parseReply(raw: string): { emotion: CoachEmotion | null; text: string } {
  const m = raw.match(EMOTION_TAG_RE);
  if (m) {
    const e = m[1] as CoachEmotion;
    return { emotion: VALID_EMOTIONS.includes(e) ? e : "neutral", text: raw.slice(m[0].length) };
  }
  // タグがまだ閉じていない間は本文を出さない
  if (/^\s*\[/.test(raw) && !raw.includes("]")) return { emotion: null, text: "" };
  return { emotion: null, text: raw };
}

function storageKey(id: string) {
  return `talk_${id}`;
}

/* ── 立ち絵（表情クロスフェード） ── */
function Portrait({ coach, emotion, speaking, loading }: { coach: Coach; emotion: CoachEmotion; speaking: boolean; loading: boolean }) {
  const target = portraitOf(coach, emotion);
  const [src, setSrc] = useState(target);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (target === src) return;
    setFading(true);
    const t = setTimeout(() => { setSrc(target); setFading(false); }, 200);
    return () => clearTimeout(t);
  }, [target, src]);

  return (
    <div className="absolute inset-0">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={coach.name}
          className="w-full h-full object-cover"
          style={{
            objectPosition: "50% 18%",
            opacity: fading ? 0 : 1,
            transition: "opacity 0.2s ease",
            animation: speaking ? "characterBob 1.5s ease-in-out infinite" : "characterFloat 5s ease-in-out infinite",
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#2a2545] to-[#14121f] text-7xl">
          {coach.icon ?? "🙂"}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#14121f] via-[#14121f]/70 to-transparent" />
      {(speaking || loading) && (
        <div className="absolute left-4 top-14 flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur px-3 py-1 text-[11px] text-white/85">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          {loading && !speaking ? "考え中…" : "話し中"}
        </div>
      )}
    </div>
  );
}

export default function ConsultPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [emotion, setEmotion] = useState<CoachEmotion>("idle");
  const [isLoading, setIsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  /* 初回の質問（呼び名・年代） */
  const [profile, setProfile] = useState<TalkProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [obStep, setObStep] = useState<"name" | "age">("name");
  const [obName, setObName] = useState("");
  const [obNameAnswer, setObNameAnswer] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const tts = useTextToSpeech();
  const sendRef = useRef<(text: string) => void>(() => {});

  /* マウント後に localStorage から読む（SSRとの不一致を避ける） */
  useEffect(() => {
    setProfile(getProfile());
    setProfileLoaded(true);
  }, []);

  /* 続きがあるコーチ */
  useEffect(() => {
    if (coach) return;
    const ids = coaches.filter((c) => {
      try { return (JSON.parse(localStorage.getItem(storageKey(c.id)) ?? "[]") as Message[]).length > 0; } catch { return false; }
    }).map((c) => c.id);
    setSavedIds(ids);
  }, [coach]);

  /* 会話の保存（コーチごと） */
  useEffect(() => {
    if (!coach || isLoading) return;
    try {
      localStorage.setItem(storageKey(coach.id), JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* 容量超過などは無視 */ }
  }, [messages, coach, isLoading]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, obStep, obNameAnswer]);

  const selectCoach = (c: Coach) => {
    let restored: Message[] = [];
    try {
      const raw = localStorage.getItem(storageKey(c.id));
      if (raw) restored = JSON.parse(raw);
    } catch { /* noop */ }
    setMessages(restored);
    setEmotion("smile");
    setObStep("name");
    setObName("");
    setObNameAnswer(null);
    setCoach(c);
    if (tts.voiceBoxAvailable && tts.speakerStyles.length > 0) {
      for (const name of c.voicePrefs) {
        const found =
          tts.speakerStyles.find((s) => s.speakerName === name && s.name === "ノーマル") ??
          tts.speakerStyles.find((s) => s.speakerName === name);
        if (found) { tts.setSelectedSpeakerId(found.id); break; }
      }
    }
  };

  const leaveChat = () => {
    tts.stop();
    setCoach(null);
  };

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || isLoading || !coach) return;
      tts.stop();
      const history: Message[] = [...messages, { role: "user", content: body }];
      setMessages(history);
      setInput("");
      setIsLoading(true);
      setEmotion("neutral");

      try {
        const res = await fetch("/api/talk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, coachId: coach.id, profile }),
        });
        if (!res.body) throw new Error("no body");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";
        let spoken = 0;
        let ttsBuf = "";
        setMessages([...history, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          if (raw.startsWith("[ERROR]:")) continue;
          const { emotion: e, text: shown } = parseReply(raw);
          if (e) setEmotion(e);
          setMessages([...history, { role: "assistant", content: shown }]);
          ttsBuf += shown.slice(spoken);
          spoken = shown.length;
          while (true) {
            const m = ttsBuf.match(/^([\s\S]*?[。！？])/);
            if (!m) break;
            const s = m[1].trim();
            if (s.length >= 2) tts.pushChunk(s);
            ttsBuf = ttsBuf.slice(m[1].length);
          }
        }
        if (raw.startsWith("[ERROR]:")) {
          setMessages([...history, { role: "assistant", content: "ごめんね、うまくつながらなかったみたい。少し経ってからもう一度話しかけてくれる？" }]);
          setEmotion("worried");
        } else if (ttsBuf.trim()) {
          tts.pushChunk(ttsBuf.trim());
        }
      } catch {
        setMessages([...history, { role: "assistant", content: "ごめんね、送信に失敗しちゃった。もう一度試してみて。" }]);
        setEmotion("worried");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, coach, tts, profile]
  );

  useEffect(() => { sendRef.current = send; }, [send]);

  const onVoiceResult = useCallback((text: string) => {
    if (text.trim()) sendRef.current(text);
  }, []);
  const voice = useVoiceInput(onVoiceResult);

  const resetConversation = () => {
    if (!coach) return;
    if (!confirm("この会話をリセットしますか？")) return;
    tts.stop();
    setMessages([]);
    setEmotion("smile");
    try { localStorage.removeItem(storageKey(coach.id)); } catch { /* noop */ }
  };

  /* ── 初回の質問フロー ── */
  const finishName = (answer: string) => {
    setObNameAnswer(answer || "入力しない");
    setObName(answer);
    setObStep("age");
    setEmotion("smile");
  };
  const finishAge = (age: string) => {
    const p: TalkProfile = { nickname: obName, ageGroup: age };
    saveProfile(p);
    setProfile(p);
    setEmotion("happy");
  };

  const needsOnboarding = profileLoaded && !profile;

  /* ══════ コーチ選択 ══════ */
  if (!coach) {
    return (
      <main className="fit-page px-5 sm:px-8 pb-10 pt-4 sm:pt-5">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col md:min-h-0 md:flex-1">
          <div className="reveal flex min-h-[44px] md:h-11 flex-wrap items-center justify-between gap-x-6 gap-y-3" style={{ ["--i" as string]: 0 }}>
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight sm:text-4xl">
              <span className="text-grad">今日は誰に、相談する？</span>
            </h1>
          </div>

          <div className="fit-grid mt-4 grid w-full gap-4 sm:grid-cols-2 md:mx-auto md:max-w-[820px] md:grid-rows-[minmax(0,1fr)] md:gap-5">
            {coaches.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => selectCoach(c)}
                className="reveal lift group relative min-h-0 overflow-hidden rounded-[28px] bg-[#1d1a2e] text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                style={{ ["--i" as string]: idx + 1 }}
              >
                <div className="aspect-[4/5] overflow-hidden md:absolute md:inset-0 md:aspect-auto">
                  {c.images ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.images.idle} alt={c.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ objectPosition: "50% 18%" }} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#2a2545] to-[#1d1a2e] text-6xl">{c.icon ?? "🙂"}</div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#14121f] via-[#14121f]/85 to-transparent p-6 pt-20">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-2xl font-extrabold tracking-tight">{c.name}</span>
                    <span className="text-xs text-white/55">{c.role}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/80">{c.tagline}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span key={t} className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/75">{t}</span>
                    ))}
                    {savedIds.includes(c.id) && <span className="rounded-md bg-pink-400/20 px-2 py-1 text-[11px] text-pink-200">続きから</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ══════ 会話画面 ══════ */
  const busy = isLoading || voice.status === "recording";
  const nick = profile?.nickname;
  const greeting = nick ? `${nick}さん、${coach.greeting}` : coach.greeting;

  return (
    <main className="screen-h bg-[#14121f] text-white flex justify-center">
      <div className="relative w-full max-w-[520px] lg:max-w-[1120px] h-full flex flex-col lg:flex-row">
        {/* 立ち絵 */}
        <div className="relative flex-shrink-0 h-[44%] min-h-[220px] overflow-hidden lg:h-full lg:w-1/2 lg:min-h-0">
          <Portrait coach={coach} emotion={emotion} speaking={tts.speaking} loading={isLoading} />
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between gap-2 px-3 py-3">
            <button
              onClick={leaveChat}
              className="rounded-full bg-black/35 backdrop-blur px-3 py-1.5 text-xs text-white/85 hover:bg-black/50"
            >
              ←<span className="hidden sm:inline"> えらびなおす</span><span className="sm:hidden"> 戻る</span>
            </button>
            <div className="flex gap-1.5">
              <button
                onClick={tts.toggle}
                className={`rounded-full backdrop-blur px-3 py-1.5 text-xs ${tts.enabled ? "bg-pink-400/40 text-white" : "bg-black/35 text-white/70"}`}
              >
                {tts.enabled ? "🔊" : "🔇"}<span className="hidden sm:inline">{tts.enabled ? " 声オン" : " 声オフ"}</span>
              </button>
              <button
                onClick={resetConversation}
                disabled={messages.length === 0}
                className="rounded-full bg-black/35 backdrop-blur px-3 py-1.5 text-xs text-white/70 hover:bg-black/50 disabled:opacity-30"
              >
                リセット
              </button>
            </div>
          </div>
          <div className="absolute left-4 bottom-3">
            <p className="text-lg font-bold leading-none">{coach.name}</p>
            <p className="text-[11px] text-white/60 mt-1">{coach.role}</p>
          </div>
        </div>

        {/* 右側（PCでは立ち絵の隣）: メッセージ・入力 */}
        <div className="flex flex-1 min-h-0 flex-col lg:w-1/2 lg:flex-none lg:max-w-[600px]">
          {/* メッセージ */}
          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 scrollbar-hide">
            {needsOnboarding ? (
              <>
                <Bubble role="assistant" text={`はじめまして、${coach.name}です。これから話しやすくなるように、少しだけ教えてもらえますか？ まず、呼び名はありますか？`} />
                {obNameAnswer !== null && (
                  <>
                    <Bubble role="user" text={obNameAnswer} />
                    <Bubble role="assistant" text={`${obName ? `${obName}さん、` : ""}ありがとう。年代も聞いていいですか？ 話題の参考にするだけです。`} />
                  </>
                )}
              </>
            ) : (
              <>
                <Bubble role="assistant" text={greeting} />
                {messages.map((m, i) =>
                  m.content === "" ? null : <Bubble key={i} role={m.role} text={m.content} />
                )}
                {isLoading && (messages.at(-1)?.role === "user" || messages.at(-1)?.content === "") ? (
                  <div className="flex gap-1 px-4 py-3 w-fit rounded-2xl rounded-tl-sm bg-white/10">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* 入力 */}
          <div className="flex-shrink-0 px-4 pb-4 pt-2">
            {needsOnboarding ? (
              obStep === "name" ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={obName}
                      onChange={(e) => setObName(e.target.value.slice(0, 10))}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing && obName.trim()) finishName(obName.trim()); }}
                      placeholder="10文字以内で入力"
                      className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/35 outline-none focus:bg-white/15"
                    />
                    <button
                      onClick={() => finishName(obName.trim())}
                      disabled={!obName.trim()}
                      className="rounded-2xl bg-gradient-to-br from-pink-400 to-fuchsia-500 px-5 text-sm disabled:opacity-30"
                    >
                      これで
                    </button>
                  </div>
                  <button onClick={() => finishName("")} className="w-full rounded-2xl bg-white/10 py-2.5 text-sm text-white/80 hover:bg-white/15">入力しない</button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((a) => (
                    <button key={a} onClick={() => finishAge(a)} className="rounded-full bg-white/10 px-4 py-2 text-sm hover:bg-pink-400/40">{a}</button>
                  ))}
                  <button onClick={() => finishAge("")} className="rounded-full bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10">答えない</button>
                </div>
              )
            ) : (
              <>
                <div className="flex items-end gap-2">
                  {voice.status !== "unsupported" && (
                    <button
                      onClick={voice.toggle}
                      disabled={isLoading}
                      title="音声入力"
                      className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                        voice.status === "recording" ? "bg-pink-500 shadow-lg shadow-pink-500/40 scale-110" : "bg-white/10 hover:bg-white/15 disabled:opacity-30"
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); }
                    }}
                    rows={1}
                    disabled={busy}
                    placeholder={voice.status === "recording" ? "🎙 聞いてるよ…" : `${coach.name}に話しかける`}
                    className="flex-1 resize-none rounded-2xl bg-white/10 px-4 py-3 text-sm text-white placeholder-white/35 outline-none focus:bg-white/15 max-h-28"
                  />
                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || busy}
                    className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 flex items-center justify-center disabled:opacity-30 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                {voice.errorMsg && <p className="text-xs text-pink-300 mt-2 whitespace-pre-line">{voice.errorMsg}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Bubble({ role, text }: { role: "user" | "assistant"; text: string }) {
  const mine = role === "user";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[82%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          mine
            ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white"
            : "rounded-2xl rounded-tl-sm bg-white/10 text-white/95"
        }`}
      >
        {text}
      </div>
    </div>
  );
}
