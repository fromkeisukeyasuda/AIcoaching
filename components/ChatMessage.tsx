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
            ? "bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white"
            : "bg-white/15 text-white/75"
        }`}
      >
        {isUser ? "私" : clientName.charAt(0)}
      </div>

      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white rounded-tr-sm"
            : "bg-[#1d1a2e] text-white/90 border border-white/10 rounded-tl-sm shadow-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
