"use client";

import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  clientName: string;
}

export default function ChatMessage({ message, clientName }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 animate-slide-up ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        {isUser ? "私" : clientName.charAt(0)}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
