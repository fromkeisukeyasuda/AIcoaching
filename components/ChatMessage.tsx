"use client";

import { Message } from "@/types";

interface ChatMessageProps {
  message: Message;
  clientName: string;
}

export default function ChatMessage({ message, clientName }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-slate-200 text-slate-600"
        }`}
      >
        {isUser ? "私" : clientName.charAt(0)}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white text-slate-700 border border-slate-200 rounded-tl-sm shadow-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
