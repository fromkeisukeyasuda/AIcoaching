import { notFound } from "next/navigation";
import Link from "next/link";
import ShareButtons from "./ShareButtons";

// ─── タイプ別データ ───────────────────────────────────────────────
const TYPE_DATA = {
  meaning: {
    name: "意味の沈黙",
    color: "#6366F1",
    essence: "なぜやるかが、揺らいでいる。",
    poem: `あなたは長い間、走り続けてきた。\n目標を達成するたびに、次の目標が現れた。\nしかし今、ふと立ち止まったとき——\n走る理由が、霞んで見える。`,
    question: "この仕事は、私の人生に値するか。",
    cta: "その問いを、山の中で一度だけ声に出してみませんか。",
  },
  relation: {
    name: "関係の沈黙",
    color: "#EC4899",
    essence: "誰のためかが、見えなくなっている。",
    poem: `あなたは誰かのために戦ってきた。\n会社のため、家族のため、社会のため。\nしかし今、その「誰か」の顔が\nぼんやりしていないか。`,
    question: "私は本当は、誰と生きたいのか。",
    cta: "その問いを持って、自然の中に入ってみませんか。",
  },
  time: {
    name: "時間の沈黙",
    color: "#F59E0B",
    essence: "いつまでかが、言えない。",
    poem: `あなたは毎日、誰かの時間を生きている。\n会議、判断、責任——\nそのすべてに意味はある。\nしかし、あなた自身の時間は、いつ始まるのか。`,
    question: "私はいつ、自分に戻っていいのか。",
    cta: "「自分の時間」を取り戻す第一歩を、一緒に設計しましょう。",
  },
  existence: {
    name: "存在の沈黙",
    color: "#0EA5E9",
    essence: "社長である自分しか、知らない。",
    poem: `あなたはいつから、「社長」としてしか\n自分を認識しなくなりましたか。\n名刺のない場所で、ふと不安になることはないですか。\n肩書きを外した瞬間、消えてしまいそうな感覚——`,
    question: "役職のない私は、何者なのか。",
    cta: "役職のない自分と向き合う90分を、設計します。",
  },
  limit: {
    name: "限界の沈黙",
    color: "#EF4444",
    essence: "疲弊を、認められない。",
    poem: `あなたは弱音を吐けない立場にいる。\n部下には見せられない。家族には心配かけたくない。\nそうして、一人で抱えてきた重さが\n今、限界に近づいていないか。`,
    question: "私はいつ、助けを求めていいのか。",
    cta: "助けを求めていい場所が、ここにあります。",
  },
  awakening: {
    name: "覚醒の沈黙",
    color: "#10B981",
    essence: "変化の、直前にいる。",
    poem: `何かが変わろうとしている。\nあなたはそれを感じているはずだ。\n今までの正解が、正解でなくなる瞬間。\nそれは終わりではなく、始まりだ。`,
    question: "私は今、何かを手放す準備ができているか。",
    cta: "あなたはすでに準備ができています。次の山を一緒に選びましょう。",
  },
} as const;

type TypeKey = keyof typeof TYPE_DATA;

// ─── メタデータ生成 ───────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const data = TYPE_DATA[type as TypeKey];
  if (!data) return { title: "診断結果" };
  return {
    title: `${data.name} — 沈黙の問い診断結果`,
    description: data.question,
  };
}

// ─── ページ本体（サーバーコンポーネント） ─────────────────────────
export default async function ResultPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const data = TYPE_DATA[type as TypeKey];

  if (!data) notFound();

  // 背景グラデーション（10%透過）
  const bgStyle = {
    background: `linear-gradient(160deg, ${data.color}1A 0%, #ffffff 60%)`,
  };

  return (
    <main className="min-h-screen" style={bgStyle}>
      <div className="max-w-lg mx-auto px-5 py-10 flex flex-col gap-8">

        {/* ── ヘッダー：タイプ名 + カラーバー ── */}
        <header className="flex flex-col gap-3">
          <div
            className="h-1.5 w-16 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
            あなたの沈黙のタイプ
          </p>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            {data.name}
          </h1>
          <p className="text-base font-medium" style={{ color: data.color }}>
            {data.essence}
          </p>
        </header>

        {/* ── 詩的な描写 ── */}
        <section
          className="rounded-2xl p-6 border"
          style={{
            backgroundColor: `${data.color}0D`,
            borderColor: `${data.color}33`,
          }}
        >
          <p className="text-gray-700 leading-relaxed text-[15px] whitespace-pre-line">
            {data.poem}
          </p>
        </section>

        {/* ── メインの問い ── */}
        <section className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            今、本当に考えるべき問い
          </p>
          <blockquote
            className="text-2xl font-bold leading-snug"
            style={{ color: data.color }}
          >
            「{data.question}」
          </blockquote>
        </section>

        {/* ── CTA セクション ── */}
        <section className="flex flex-col gap-4 rounded-2xl bg-gray-900 p-6 text-white">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Vision Retreat Coaching
            </p>
            <p className="text-base leading-relaxed text-gray-200">
              {data.cta}
            </p>
          </div>

          <a
            href="https://yoursite.com/booking"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl py-4 px-6 font-bold text-base text-gray-900 transition-opacity hover:opacity-90 active:scale-95"
            style={{ backgroundColor: data.color === "#EF4444" ? "#FBBF24" : "#F9FAFB" }}
          >
            49,800円の体験セッションを予約する
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </section>

        {/* ── シェアボタン（クライアントコンポーネント） ── */}
        <ShareButtons
          question={data.question}
          typeName={data.name}
          color={data.color}
        />

        {/* ── もう一度診断する ── */}
        <div className="flex justify-center pb-4">
          <Link
            href="/diagnose"
            className="text-sm text-gray-400 underline underline-offset-4 hover:text-gray-600 transition-colors"
          >
            もう一度診断する
          </Link>
        </div>

      </div>
    </main>
  );
}
