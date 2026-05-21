"use client";

interface TypingIndicatorProps {
  clientName: string;
}

export default function TypingIndicator({ clientName }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-medium">
        {clientName.charAt(0)}
      </div>
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
