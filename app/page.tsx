import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080810]">
      {/* 背景グロー */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-16">

        {/* ナビゲーション */}
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-sm">AIコーチング</span>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-sm text-white/35 hover:text-white/70 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            練習履歴
          </Link>
        </nav>

        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-4 py-1.5 rounded-full mb-7">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
            AI搭載コーチングトレーナー
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
            コーチングスキルを<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">
              AIで磨く
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
            リアルなAIクライアントとの対話を通じて、<br />
            プロのコーチングスキルを身につけましょう。
          </p>
        </div>

        {/* フィーチャーカード */}
        <div className="grid sm:grid-cols-3 gap-4 mb-16">
          {[
            {
              href: "/session",
              emoji: "💬",
              emojiColor: "bg-indigo-500/15 border-indigo-500/20",
              title: "コーチング練習",
              desc: "AIが演じるクライアントとリアルなセッションを体験。音声入力で自然なコーチングを練習できます。",
              action: "セッションを開始する",
              actionColor: "text-indigo-400",
              hoverBorder: "hover:border-indigo-500/30",
            },
            {
              href: "/evaluation",
              emoji: "📊",
              emojiColor: "bg-emerald-500/15 border-emerald-500/20",
              title: "セッション評価",
              desc: "傾聴力・質問力・共感力など5つの軸でAIが詳細に分析。弱点と強みを具体的に把握できます。",
              action: "評価を確認する",
              actionColor: "text-emerald-400",
              hoverBorder: "hover:border-emerald-500/30",
            },
            {
              href: "/history",
              emoji: "📈",
              emojiColor: "bg-violet-500/15 border-violet-500/20",
              title: "練習履歴",
              desc: "スコア推移を可視化し、前回の改善点が今回のセッションで対応できたかを自動追跡します。",
              action: "履歴を見る",
              actionColor: "text-violet-400",
              hoverBorder: "hover:border-violet-500/30",
            },
          ].map((card) => (
            <Link key={card.href} href={card.href} className="group">
              <div className={`bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] ${card.hoverBorder} rounded-2xl p-6 transition-all duration-200 h-full flex flex-col`}>
                <div className={`w-11 h-11 ${card.emojiColor} border rounded-xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {card.emoji}
                </div>
                <h2 className="text-white font-semibold mb-2">{card.title}</h2>
                <p className="text-white/35 text-sm leading-relaxed mb-5 flex-1">
                  {card.desc}
                </p>
                <div className={`flex items-center ${card.actionColor} text-sm font-medium`}>
                  {card.action}
                  <svg className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 使い方 */}
        <div className="border-t border-white/[0.06] pt-12">
          <p className="text-center text-[10px] font-semibold text-white/20 uppercase tracking-[0.2em] mb-10">
            使い方
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: "01", title: "シナリオを選ぶ", desc: "3種類のビルトインシナリオ、またはカスタムシナリオで練習開始" },
              { step: "02", title: "セッションを実施", desc: "音声またはテキストでAIクライアントとコーチング。リアルタイム読み上げ対応" },
              { step: "03", title: "成長を追跡する", desc: "評価で強み・弱点を把握し、前回からの改善を自動で確認" },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-5xl font-bold text-white/[0.04] mb-3 font-mono">{item.step}</div>
                <h4 className="font-semibold text-white/60 mb-1.5 text-sm">{item.title}</h4>
                <p className="text-sm text-white/25 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
