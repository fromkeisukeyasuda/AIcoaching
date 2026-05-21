"use client";

interface TypingIndicatorProps {
  clientName: string;
}

export default function TypingIndicator({ clientName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white/10 text-white/60 flex items-center justify-center text-xs font-semibold">
        {clientName.charAt(0)}
      </div>
      <div className="bg-white/[0.07] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-2.5">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
