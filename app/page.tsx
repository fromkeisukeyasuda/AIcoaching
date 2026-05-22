import Link from "next/link";

export default function Home() {
  return (
    <main className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      {/* ナビゲーション */}
      <nav className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <span className="text-slate-800 font-bold text-base tracking-tight">AIコーチトレーナー</span>
        </div>
        <Link
          href="/history"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          練習履歴
        </Link>
      </nav>

      {/* メインコンテンツ（全画面内に収まる） */}
      <div className="flex-1 flex flex-col justify-center overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 w-full py-6">

          {/* ヒーロー */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
              AI搭載コーチングトレーニングシステム
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 tracking-tight leading-[1.15]">
              コーチングスキルを<br />
              <span className="text-blue-600">AIで磨く</span>
            </h1>
            <p className="text-slate-500 text-[15px] max-w-sm mx-auto leading-relaxed">
              AIクライアントとの本格的な対話を通じて、<br />
              プロのコーチングスキルを安心して身につけましょう。
            </p>
          </div>

          {/* フィーチャーカード */}
          <div className="grid sm:grid-cols-3 gap-4 mb-7">
            {[
              {
                href: "/session",
                emoji: "💬",
                bg: "bg-blue-50",
                border: "border-blue-200",
                hoverBorder: "hover:border-blue-400",
                title: "コーチング練習",
                desc: "AIが演じるクライアントとリアルなセッションを体験。音声入力で自然なコーチングを練習できます。",
                action: "セッションを開始する",
                actionColor: "text-blue-600",
              },
              {
                href: "/evaluation",
                emoji: "📊",
                bg: "bg-emerald-50",
                border: "border-emerald-200",
                hoverBorder: "hover:border-emerald-400",
                title: "セッション評価",
                desc: "傾聴力・質問力・共感力など5軸でAIが詳細に分析。弱点と強みを具体的に把握できます。",
                action: "評価を確認する",
                actionColor: "text-emerald-600",
              },
              {
                href: "/history",
                emoji: "📈",
                bg: "bg-violet-50",
                border: "border-violet-200",
                hoverBorder: "hover:border-violet-400",
                title: "練習履歴",
                desc: "スコア推移を可視化し、前回の改善点が今回のセッションで対応できたかを自動追跡します。",
                action: "履歴を見る",
                actionColor: "text-violet-600",
              },
            ].map((card) => (
              <Link key={card.href} href={card.href} className="group">
                <div className={`bg-white border ${card.border} ${card.hoverBorder} rounded-2xl p-5 transition-all duration-200 h-full flex flex-col shadow-sm hover:shadow-md`}>
                  <div className={`w-10 h-10 ${card.bg} border ${card.border} rounded-xl flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    {card.emoji}
                  </div>
                  <h2 className="text-slate-800 font-semibold mb-1.5 text-sm">{card.title}</h2>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-1">
                    {card.desc}
                  </p>
                  <div className={`flex items-center ${card.actionColor} text-xs font-semibold`}>
                    {card.action}
                    <svg className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* 使い方（コンパクト横並び） */}
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
            <div className="flex items-center justify-center gap-0">
              {[
                { step: "01", title: "シナリオを選ぶ", desc: "3種類の内蔵シナリオからスタート" },
                { step: "02", title: "セッションを実施", desc: "音声 or テキストでAIとコーチング" },
                { step: "03", title: "成長を追跡する", desc: "評価で強み・弱点を把握" },
              ].map((item, i) => (
                <div key={item.step} className="flex items-center">
                  <div className="text-center px-6">
                    <div className="text-xs font-bold text-slate-300 font-mono mb-1">{item.step}</div>
                    <div className="text-xs font-semibold text-slate-600 mb-0.5">{item.title}</div>
                    <div className="text-xs text-slate-400">{item.desc}</div>
                  </div>
                  {i < 2 && (
                    <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
