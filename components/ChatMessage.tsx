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
            ? "bg-indigo-600 text-white"
            : "bg-white/10 text-white/60"
        }`}
      >
        {isUser ? "私" : clientName.charAt(0)}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-indigo-600 text-white rounded-tr-sm"
            : "bg-white/[0.07] text-white/80 border border-white/[0.08] rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
