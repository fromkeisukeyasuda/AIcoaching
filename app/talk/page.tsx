"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario } from "@/types";
import { scenarios as builtInScenarios } from "@/lib/scenarios";
import { Coach, CoachEmotion, clients, coaches, customClient, portraitOf, EMOTION_TAG_RE } from "@/lib/coaches";
import {
  Counseling, TalkProfile, addCounselingXp, getCounseling, getDiary, getProfile,
  saveProfile, todayStr, upsertDiary, xpNeeded, XP_PER_COACH_MESSAGE,
} from "@/lib/talkStore";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

type TalkMode = "consult" | "practice";

const MODE_LABEL: Record<TalkMode, string> = { consult: "相談する", practice: "面談練習" };
const MODE_DESC: Record<TalkMode, string> = {
  consult: "あなたが相談者。イケメンコーチに気軽に話を聴いてもらう",
  practice: "あなたがコーチ。相談者役のキャラと面談を練習して評価をもらう",
};

const AGE_GROUPS = ["10代", "20代", "30代", "40代", "50代", "60代以上"];
const MAX_STORED = 60;
const SUMMARIZE_EVERY = 6; // 相談モードで、ユーザー発言がこの回数ごとに日記を更新
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

function storageKey(id: string, mode: TalkMode) {
  return mode === "consult" ? `talk_${id}` : `talk_practice_${id}`;
}

function ModeSwitch({ mode, onChange, compact = false }: { mode: TalkMode; onChange: (m: TalkMode) => void; compact?: boolean }) {
  return (
    <div className={`inline-flex rounded-full bg-white/10 p-1 ${compact ? "text-xs" : "text-sm"}`}>
      {(Object.keys(MODE_LABEL) as TalkMode[]).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-full px-4 py-1.5 transition-all ${
            mode === m ? "bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white shadow" : "text-white/60 hover:text-white"
          }`}
        >
          {MODE_LABEL[m]}
        </button>
      ))}
    </div>
  );
}

/* カウンセリングLv（面談練習モード） */
function LevelBar({ c, flash = false }: { c: Counseling; flash?: boolean }) {
  const pct = Math.min(100, (c.xp / xpNeeded(c.lv)) * 100);
  return (
    <div className={`flex items-center gap-3 rounded-full bg-white/5 px-4 py-2 text-xs ${flash ? "ring-2 ring-emerald-300" : ""}`}>
      <span className="font-bold text-emerald-200 whitespace-nowrap">カウンセリング Lv.{c.lv}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white/45 whitespace-nowrap">{c.xp}/{xpNeeded(c.lv)}</span>
    </div>
  );
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

export default function TalkPage() {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [emotion, setEmotion] = useState<CoachEmotion>("idle");
  const [isLoading, setIsLoading] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<TalkMode>("consult");
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  /* 初回質問・記憶・日記・カウンセリングLv */
  const [profile, setProfile] = useState<TalkProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [obStep, setObStep] = useState<"name" | "age">("name");
  const [obName, setObName] = useState("");
  const [obNameAnswer, setObNameAnswer] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const [counseling, setCounseling] = useState<Counseling>({ lv: 1, xp: 0 });
  const [levelFlash, setLevelFlash] = useState(false);
  const [diaryCount, setDiaryCount] = useState(0);

  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const tts = useTextToSpeech();
  const sendRef = useRef<(text: string) => void>(() => {});
  const summarizedCountRef = useRef(0); // 日記に反映済みのユーザー発言数

  const allScenarios = [...builtInScenarios, ...customScenarios];
  /* 面談練習: 選んだ相談者キャラが演じるシナリオ */
  const scenario = mode === "practice" && coach?.scenarioId
    ? allScenarios.find((s) => s.id === coach.scenarioId)
    : undefined;
  /* キャラ選択画面に並べるキャラ（モードで切り替え） */
  const characters: Coach[] = mode === "practice"
    ? [...clients, ...customScenarios.map(customClient)]
    : coaches;
  const userMsgCount = messages.filter((m) => m.role === "user").length;

  /* マウント後に localStorage から読む（SSRとの不一致を避ける） */
  useEffect(() => {
    try {
      const m = localStorage.getItem("talk_mode");
      if (m === "consult" || m === "practice") setMode(m);
      const stored = localStorage.getItem("customScenarios");
      if (stored) setCustomScenarios(JSON.parse(stored));
    } catch { /* noop */ }
    setProfile(getProfile());
    setProfileLoaded(true);
    setCounseling(getCounseling());
    setDiaryCount(getDiary().length);
  }, []);

  const changeMode = (m: TalkMode) => {
    setMode(m);
    try { localStorage.setItem("talk_mode", m); } catch { /* noop */ }
  };

  /* 続きがあるコーチ */
  useEffect(() => {
    if (coach) return;
    const ids = characters.filter((c) => {
      try { return (JSON.parse(localStorage.getItem(storageKey(c.id, mode)) ?? "[]") as Message[]).length > 0; } catch { return false; }
    }).map((c) => c.id);
    setSavedIds(ids);
    setDiaryCount(getDiary().length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach, mode, customScenarios]);

  /* 会話の保存（コーチ・モードごと） */
  useEffect(() => {
    if (!coach || isLoading) return;
    try {
      localStorage.setItem(storageKey(coach.id, mode), JSON.stringify(messages.slice(-MAX_STORED)));
    } catch { /* 容量超過などは無視 */ }
  }, [messages, coach, mode, isLoading]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading, opening, obStep, obNameAnswer]);

  /* ── 日記（会話の要点）を更新する。失敗しても会話は止めない ── */
  const saveDiary = useCallback(async (c: Coach, msgs: Message[], force = false) => {
    const userCount = msgs.filter((m) => m.role === "user").length;
    if (userCount < 2) return;
    if (!force && userCount <= summarizedCountRef.current) return;
    summarizedCountRef.current = userCount;
    try {
      const res = await fetch("/api/talk/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs.slice(-40), nickname: getProfile()?.nickname }),
      });
      if (!res.ok) return;
      const data = await res.json() as { summary: string; mood: string; topics: string[] };
      upsertDiary({ date: todayStr(), coachId: c.id, summary: data.summary, mood: data.mood, topics: data.topics });
      setDiaryCount(getDiary().length);
    } catch { /* noop */ }
  }, []);

  /* ── 会話の冒頭のひとこと（記憶があるときだけAIが生成） ── */
  const fetchOpening = useCallback(async (c: Coach, p: TalkProfile | null) => {
    const memories = getDiary().slice(0, 3).map((d) => ({ date: d.date, summary: d.summary }));
    if (memories.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [], coachId: c.id, mode: "consult", profile: p, memories, opening: true }),
      });
      const raw = await res.text();
      if (raw.startsWith("[ERROR]:")) return;
      const { emotion: e, text } = parseReply(raw);
      if (text.trim()) {
        setOpening(text.trim());
        setEmotion(e ?? "smile");
        tts.pushChunk(text.trim());
      }
    } catch { /* 静的なあいさつにフォールバック */ } finally {
      setIsLoading(false);
    }
  }, [tts]);

  const enterChat = (c: Coach, m: TalkMode) => {
    let restored: Message[] = [];
    try {
      const raw = localStorage.getItem(storageKey(c.id, m));
      if (raw) restored = JSON.parse(raw);
    } catch { /* noop */ }
    setMessages(restored);
    setStartedAt(null);
    setOpening(null);
    summarizedCountRef.current = restored.filter((x) => x.role === "user").length;
    setEmotion(m === "practice" ? "neutral" : "smile");
    setCoach(c);
    if (m === "consult" && restored.length === 0 && getProfile()) {
      fetchOpening(c, getProfile());
    }
  };

  const selectCoach = (c: Coach) => {
    if (tts.voiceBoxAvailable && tts.speakerStyles.length > 0) {
      for (const name of c.voicePrefs) {
        const found =
          tts.speakerStyles.find((s) => s.speakerName === name && s.name === "ノーマル") ??
          tts.speakerStyles.find((s) => s.speakerName === name);
        if (found) { tts.setSelectedSpeakerId(found.id); break; }
      }
    }
    setObStep("name");
    setObName("");
    setObNameAnswer(null);
    enterChat(c, mode);
  };

  /* 離れるとき・切り替えるときに、相談モードの会話を日記へ */
  const leaveChat = () => {
    if (!coach) return;
    tts.stop();
    if (mode === "consult") saveDiary(coach, messages);
    setCoach(null);
  };

  /* 会話中にモードを切り替える → キャラ選択に戻る（モードごとに登場キャラが違うため） */
  const switchModeInChat = (m: TalkMode) => {
    if (!coach || m === mode || isLoading) return;
    tts.stop();
    if (mode === "consult") saveDiary(coach, messages);
    changeMode(m);
    setCoach(null);
  };

  const send = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || isLoading || !coach) return;
      if (mode === "practice" && !scenario) return;
      tts.stop();
      const history: Message[] = [...messages, { role: "user", content: body }];
      if (!startedAt) setStartedAt(new Date().toISOString());
      setMessages(history);
      setInput("");
      setIsLoading(true);
      setEmotion("neutral");

      /* 面談練習: コーチ役の発言ごとにカウンセリングLvの経験値 */
      if (mode === "practice") {
        const { state, leveledUp } = addCounselingXp(XP_PER_COACH_MESSAGE);
        setCounseling(state);
        if (leveledUp) {
          setLevelFlash(true);
          setTimeout(() => setLevelFlash(false), 2500);
        }
      }

      const memories = mode === "consult" ? getDiary().slice(0, 3).map((d) => ({ date: d.date, summary: d.summary })) : undefined;

      try {
        const res = await fetch("/api/talk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            coachId: coach.id,
            mode,
            scenario: mode === "practice" ? scenario : undefined,
            profile: mode === "consult" ? profile : undefined,
            memories,
            openingText: mode === "consult" ? opening ?? undefined : undefined,
          }),
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
        } else {
          if (ttsBuf.trim()) tts.pushChunk(ttsBuf.trim());
          /* 相談モード: 一定回数ごとに日記を更新 */
          const userCount = history.filter((x) => x.role === "user").length;
          if (mode === "consult" && userCount % SUMMARIZE_EVERY === 0) {
            saveDiary(coach, [...history, { role: "assistant", content: parseReply(raw).text }]);
          }
        }
      } catch {
        setMessages([...history, { role: "assistant", content: "ごめんね、送信に失敗しちゃった。もう一度試してみて。" }]);
        setEmotion("worried");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, coach, tts, mode, scenario, startedAt, profile, opening, saveDiary]
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
    if (mode === "consult") saveDiary(coach, messages); // 消す前に日記には残す
    setMessages([]);
    setOpening(null);
    summarizedCountRef.current = 0;
    setStartedAt(null);
    setEmotion(mode === "practice" ? "neutral" : "smile");
    try { localStorage.removeItem(storageKey(coach.id, mode)); } catch { /* noop */ }
  };

  /* 面談練習を終了 → 既存の評価画面へ */
  const endPractice = () => {
    if (!coach || !scenario || userMsgCount < 2) return;
    tts.stop();
    localStorage.setItem("coachingSession", JSON.stringify({
      scenario,
      messages,
      startedAt: startedAt ?? new Date().toISOString(),
      endedAt: new Date().toISOString(),
    }));
    router.push("/evaluation");
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
    if (coach && messages.length === 0) fetchOpening(coach, p);
  };

  const needsOnboarding = mode === "consult" && profileLoaded && !profile;

  /* ══════ コーチ選択 ══════ */
  if (!coach) {
    return (
      <main className="min-h-[calc(100vh-64px)] bg-[#14121f] text-white px-5 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-pink-300/80 text-xs tracking-widest mb-2">TALK</p>
              <h1 className="text-2xl font-bold mb-1">{mode === "practice" ? "今日は誰の相談を聴く？" : "今日は誰と話す？"}</h1>
              <p className="text-white/50 text-sm mb-5">
                {mode === "practice" ? "相談者を選んで、コーチとして面談を練習しましょう。" : "気軽に話せるAIコーチ。愚痴も、考えごとも、そのままどうぞ。"}
              </p>
            </div>
            <Link href="/talk/diary" className="flex-shrink-0 rounded-full bg-white/10 px-4 py-2 text-xs text-white/85 hover:bg-white/15">
              📖 日記{diaryCount > 0 ? `（${diaryCount}）` : ""}
            </Link>
          </div>
          <div className="mb-8 space-y-3">
            <ModeSwitch mode={mode} onChange={changeMode} />
            <p className="text-xs text-white/55">{MODE_DESC[mode]}</p>
            {mode === "practice" && <div className="max-w-md"><LevelBar c={counseling} /></div>}
          </div>
          <div className={`grid gap-5 ${characters.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCoach(c)}
                className="group relative overflow-hidden rounded-3xl text-left bg-[#1d1a2e] border border-white/10 hover:border-pink-300/60 transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  {c.images ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.images.idle} alt={c.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" style={{ objectPosition: "50% 18%" }} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#2a2545] to-[#1d1a2e] text-6xl">{c.icon ?? "🙂"}</div>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 pt-16 bg-gradient-to-t from-[#14121f] via-[#14121f]/85 to-transparent">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-xl font-bold">{c.name}</span>
                    <span className="text-xs text-white/55">{c.role}</span>
                  </div>
                  <p className="text-sm text-white/80 mt-1">{c.tagline}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {c.tags.map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-white/75">{t}</span>
                    ))}
                    {savedIds.includes(c.id) && <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-400/20 text-pink-200">続きから</span>}
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
  const staticGreeting = nick ? `${nick}さん、${coach.greeting}` : coach.greeting;
  const showNormalChat = !needsOnboarding;

  return (
    <main className="h-[calc(100vh-64px)] bg-[#14121f] text-white flex justify-center">
      <div className="relative w-full max-w-[520px] h-full flex flex-col">
        {/* 立ち絵 */}
        <div className="relative flex-shrink-0 h-[44%] min-h-[220px] overflow-hidden">
          <Portrait coach={coach} emotion={emotion} speaking={tts.speaking} loading={isLoading} />
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-3 py-3">
            <button
              onClick={leaveChat}
              className="rounded-full bg-black/35 backdrop-blur px-3 py-1.5 text-xs text-white/85 hover:bg-black/50"
            >
              ← えらびなおす
            </button>
            <div className="flex gap-1.5">
              {mode === "practice" && (
                <button
                  onClick={endPractice}
                  disabled={userMsgCount < 2 || isLoading}
                  title={userMsgCount < 2 ? "2回以上話しかけると評価できます" : undefined}
                  className="rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 px-3 py-1.5 text-xs text-white disabled:opacity-30"
                >
                  終了して評価
                </button>
              )}
              <button
                onClick={tts.toggle}
                className={`rounded-full backdrop-blur px-3 py-1.5 text-xs ${tts.enabled ? "bg-pink-400/40 text-white" : "bg-black/35 text-white/70"}`}
              >
                {tts.enabled ? "🔊 声オン" : "🔇 声オフ"}
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
          <div className="absolute right-3 bottom-3">
            <ModeSwitch mode={mode} onChange={switchModeInChat} compact />
          </div>
        </div>

        {mode === "practice" && (
          <div className="flex-shrink-0 px-4 pt-2">
            <LevelBar c={counseling} flash={levelFlash} />
            {levelFlash && <p className="mt-1 text-center text-xs text-emerald-200">レベルアップ！ カウンセリング Lv.{counseling.lv}</p>}
          </div>
        )}

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
          ) : mode === "consult" ? (
            <Bubble role="assistant" text={opening ?? staticGreeting} />
          ) : scenario ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-relaxed text-white/70">
              <p className="font-bold text-pink-200 mb-1">面談練習 ─ {scenario.title}</p>
              <p>あなたがコーチ役です。{coach.name}さんは次の状況の相談者を演じます。</p>
              <p className="mt-1 text-white/55">{scenario.situation}</p>
              <p className="mt-1 text-white/55">まずは挨拶や最初の質問から始めてみましょう。</p>
            </div>
          ) : (
            <p className="text-xs text-white/50">このキャラのシナリオが見つかりませんでした。選びなおしてください。</p>
          )}
          {showNormalChat && messages.map((m, i) =>
            m.content === "" ? null : <Bubble key={i} role={m.role} text={m.content} />
          )}
          {showNormalChat && isLoading && (messages.length === 0 || messages.at(-1)?.role === "user" || messages.at(-1)?.content === "") ? (
            <div className="flex gap-1 px-4 py-3 w-fit rounded-2xl rounded-tl-sm bg-white/10">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : null}
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
                  placeholder={voice.status === "recording" ? "🎙 聞いてるよ…" : mode === "practice" ? "コーチとして話しかける" : `${coach.name}に話しかける`}
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
