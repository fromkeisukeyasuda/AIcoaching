"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario } from "@/types";
import { scenarios as builtInScenarios } from "@/lib/scenarios";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export default function SessionPage() {
  const router = useRouter();
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 音声機能
  const onVoiceResult = useCallback((text: string) => {
    setInput((prev) => prev + text);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, []);
  const voice = useVoiceInput(onVoiceResult);
  const tts = useTextToSpeech();

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ストリーミング共通処理
  const streamResponse = useCallback(
    async (msgHistory: Message[], scenario: Scenario) => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgHistory, scenario }),
      });
      if (!response.body) throw new Error("レスポンスの取得に失敗しました");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let text = "";

      setMessages([...msgHistory, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value);
        setMessages([...msgHistory, { role: "assistant", content: text }]);
      }

      // ストリーム完了後に読み上げ
      if (text) tts.speak(text);
      return text;
    },
    [tts]
  );

  const startSession = useCallback(
    async (scenario: Scenario) => {
      setIsStarting(true);
      setSelectedScenario(scenario);
      setSessionStartTime(new Date().toISOString());
      try {
        const openingMessages: Message[] = [
          {
            role: "user",
            content:
              "こんにちは。今日はよろしくお願いします。まず、最近どんなことが気になっていますか？",
          },
        ];
        await streamResponse(openingMessages, scenario);
      } catch {
        setMessages([
          {
            role: "assistant",
            content: "接続エラーが発生しました。ページを再読み込みしてお試しください。",
          },
        ]);
      } finally {
        setIsStarting(false);
      }
    },
    [streamResponse]
  );

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedScenario) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    tts.stop();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      await streamResponse(newMessages, selectedScenario);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "メッセージの送信に失敗しました。もう一度お試しください。",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const endSession = () => {
    if (!selectedScenario || messages.length === 0) return;
    tts.stop();
    const sessionData = {
      scenario: selectedScenario,
      messages,
      startedAt: sessionStartTime,
      endedAt: new Date().toISOString(),
    };
    localStorage.setItem("coachingSession", JSON.stringify(sessionData));
    router.push("/evaluation");
  };

  // ── シナリオ選択画面 ─────────────────────────────────────
  if (!selectedScenario) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              ホームに戻る
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-1">コーチング練習</h1>
                <p className="text-slate-500 text-sm">シナリオを選んでセッションを始めましょう</p>
              </div>
              <Link
                href="/scenario/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                シナリオを作成
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <div key={scenario.id} className="relative group/card">
                <button
                  onClick={() => startSession(scenario)}
                  className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform ${scenario.isCustom ? "bg-violet-50" : "bg-indigo-50"}`}>
                      {scenario.icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-slate-800">{scenario.title}</h2>
                        {scenario.isCustom && (
                          <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">
                            カスタム
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mb-3">{scenario.description}</p>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          {scenario.clientName}
                        </span>
                        {scenario.tags.map((tag) => (
                          <span key={tag} className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                {scenario.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`「${scenario.title}」を削除しますか？`)) deleteCustomScenario(scenario.id);
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all"
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

  // ── セッション画面 ────────────────────────────────────────
  return (
    <main className="h-screen flex flex-col bg-slate-50">
      {/* ヘッダー */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
              {selectedScenario.icon}
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm leading-tight">
                {selectedScenario.clientName}
              </p>
              <p className="text-xs text-slate-400">{selectedScenario.clientRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              セッション中
            </div>

            {/* 読み上げトグル */}
            {tts.supported && (
              <button
                onClick={tts.toggle}
                title={tts.enabled ? "読み上げをオフにする" : "読み上げをオンにする"}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  tts.enabled
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {tts.speaking ? (
                  // 再生中アイコン
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                ) : tts.enabled ? (
                  // オン（音声あり）アイコン
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6.5v11m-3.536-9.036a5 5 0 000 7.072M9 12H5l3-4.5V16.5L5 12h4" />
                  </svg>
                ) : (
                  // オフ（音声なし）アイコン
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>
            )}

            <button
              onClick={endSession}
              disabled={messages.length < 2}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              終了する
            </button>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {isStarting ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">セッションを準備中...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} clientName={selectedScenario.clientName} />
              ))}
              {isLoading && <TypingIndicator clientName={selectedScenario.clientName} />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-2">

            {/* 音声入力ボタン */}
            {voice.status !== "unsupported" && (
              <button
                onClick={voice.toggle}
                disabled={isLoading || isStarting}
                title={voice.status === "recording" ? "録音を停止" : "音声で入力"}
                className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  voice.status === "recording"
                    ? "bg-red-500 text-white shadow-lg shadow-red-200 scale-110"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-40"
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
            <div className={`flex-1 bg-slate-50 rounded-xl border transition-all ${
              voice.status === "recording"
                ? "border-red-300 ring-2 ring-red-100"
                : "border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100"
            }`}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  voice.status === "recording"
                    ? "🎙 聞き取り中..."
                    : "メッセージを入力（Enterで送信、Shift+Enterで改行）"
                }
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-none outline-none"
                disabled={isLoading || isStarting}
              />
            </div>

            {/* 送信ボタン */}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || isStarting}
              className="flex-shrink-0 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* ステータス表示 */}
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-xs text-slate-400">
              {voice.status === "recording"
                ? "🎙 話しかけてください..."
                : `あなたはコーチとして、${selectedScenario.clientName}さんをサポートしてください`}
            </p>
            {tts.enabled && (
              <p className="text-xs text-indigo-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
                読み上げオン
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
