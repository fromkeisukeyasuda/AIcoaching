"use client";

interface TypingIndicatorProps {
  clientName: string;
}

export default function TypingIndicator({ clientName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/15 text-white/75 flex items-center justify-center text-xs font-semibold">
        {clientName.charAt(0)}
      </div>
      <div className="bg-[#1d1a2e] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
