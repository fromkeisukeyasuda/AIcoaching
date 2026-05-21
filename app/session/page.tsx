"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Message, Scenario } from "@/types";
import { scenarios as builtInScenarios } from "@/lib/scenarios";
import ChatMessage from "@/components/ChatMessage";
import TypingIndicator from "@/components/TypingIndicator";

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

  const startSession = useCallback(async (scenario: Scenario) => {
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

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: openingMessages, scenario }),
      });

      if (!response.body) throw new Error("レスポンスの取得に失敗しました");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages([...openingMessages, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value);
        setMessages([
          ...openingMessages,
          { role: "assistant", content: assistantText },
        ]);
      }
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
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedScenario) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, scenario: selectedScenario }),
      });

      if (!response.body) throw new Error("レスポンスの取得に失敗しました");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      const updatedMessages = [...newMessages, { role: "assistant" as const, content: "" }];
      setMessages(updatedMessages);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value);
        setMessages([
          ...newMessages,
          { role: "assistant", content: assistantText },
        ]);
      }
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

    const sessionData = {
      scenario: selectedScenario,
      messages,
      startedAt: sessionStartTime,
      endedAt: new Date().toISOString(),
    };
    localStorage.setItem("coachingSession", JSON.stringify(sessionData));
    router.push("/evaluation");
  };

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
                        <h2 className="text-lg font-semibold text-slate-800">
                          {scenario.title}
                        </h2>
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
                          <span
                            key={tag}
                            className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <svg
                      className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                {scenario.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`「${scenario.title}」を削除しますか？`)) {
                        deleteCustomScenario(scenario.id);
                      }
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all"
                    title="削除"
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

  return (
    <main className="h-screen flex flex-col bg-slate-50">
      {/* Session Header */}
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
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-2">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              セッション中
            </div>
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

      {/* Messages Area */}
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
                <ChatMessage
                  key={index}
                  message={message}
                  clientName={selectedScenario.clientName}
                />
              ))}
              {isLoading && (
                <TypingIndicator clientName={selectedScenario.clientName} />
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力（Enterで送信、Shift+Enterで改行）"
                rows={1}
                className="w-full bg-transparent px-4 py-3 text-sm text-slate-700 placeholder-slate-400 resize-none outline-none"
                disabled={isLoading || isStarting}
              />
            </div>
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
          <p className="text-xs text-slate-400 mt-1.5 text-center">
            あなたはコーチとして、{selectedScenario.clientName}さんをサポートしてください
          </p>
        </div>
      </div>
    </main>
  );
}
