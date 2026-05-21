import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            AI搭載コーチングトレーナー
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            AIコーチング練習
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            リアルなクライアントとの対話を通じて、
            <br />
            コーチングスキルを磨きましょう。
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Link href="/session" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 h-full">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-200">
                💬
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                コーチング練習
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                AIが演じるクライアントとリアルなコーチングセッションを体験。様々なシナリオで実践的なスキルを身につけましょう。
              </p>
              <div className="flex items-center text-indigo-600 text-sm font-medium">
                セッションを開始する
                <svg
                  className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/evaluation" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all duration-200 h-full">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-200">
                📊
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                セッション評価
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                セッション後にAIがコーチングの質を分析。傾聴力・質問力・共感力など複数の観点から詳細なフィードバックを提供します。
              </p>
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                評価を確認する
                <svg
                  className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* How it works */}
        <div className="mt-16 text-center">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-8">
            使い方
          </h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "シナリオを選ぶ",
                desc: "3種類のシナリオからコーチングしたいテーマを選択します",
              },
              {
                step: "02",
                title: "セッションを実施",
                desc: "AIクライアントと自由に会話。実際のコーチングと同じ感覚で練習できます",
              },
              {
                step: "03",
                title: "フィードバックを受ける",
                desc: "セッション終了後、AIが詳細な評価とアドバイスを提供します",
              },
            ].map((item) => (
              <div key={item.step} className="text-left">
                <div className="text-3xl font-bold text-indigo-100 mb-2">
                  {item.step}
                </div>
                <h4 className="font-semibold text-slate-700 mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
