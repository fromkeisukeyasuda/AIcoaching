"use client";

interface ShareButtonsProps {
  question: string;
  typeName: string;
  color: string;
}

export default function ShareButtons({ question, typeName, color }: ShareButtonsProps) {
  const tweetText = encodeURIComponent(
    `経営者向け診断「沈黙の問い」を受けた。\n\n今、本当に考えるべき問いを渡された。\n「${question}」\n\n#沈黙の問い #経営者の孤独 #VisionRetreat`
  );
  const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent("https://yoursite.com/diagnose")}`;

  const lineText = encodeURIComponent(
    `経営者向け診断「沈黙の問い」を受けました。\n\n「${question}」\n\nhttps://yoursite.com/diagnose`
  );
  const lineUrl = `https://line.me/R/msg/text/?${lineText}`;

  return (
    <div className="flex flex-col gap-3 w-full">
      <p className="text-center text-sm text-gray-500 font-medium">この診断結果をシェアする</p>
      <div className="flex gap-3">
        {/* X (Twitter) シェアボタン */}
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-800 bg-gray-900 text-white font-semibold text-sm hover:bg-gray-700 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Xでシェア
        </a>

        {/* LINE シェアボタン */}
        <a
          href={lineUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold text-sm text-white transition-colors"
          style={{ backgroundColor: "#06C755", borderColor: "#06C755" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          LINEでシェア
        </a>
      </div>
    </div>
  );
}
