"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QUIZ_GROUPS } from "@/lib/quiz";
import { SessionRecord } from "@/types";
import { getChallenge, getOverall } from "@/lib/skills";
import { getTutorial, saveTutorial, TutorialStep, TUTORIAL_STEPS, TUTORIAL_QUIZ_COUNT, MISSIONS } from "@/lib/tutorial";
import OverallBar from "@/components/OverallBar";
import { saveSettings } from "@/lib/settings";

/* チュートリアル: 1画面に1つのことだけを示して、順番に進める。
   はじめに / 面談の型 / 主訴クイズ / 面談（練習画面で、ミッションつき）/ 結果 */

const LAYERS = [
  { name: "行動層", hint: "やりがい・達成感", color: "#7EE0B5" },
  { name: "役割層", hint: "役割・責任", color: "#F9A8D4" },
  { name: "存在層", hint: "生きがい・価値観", color: "#FBBF24" },
];

function Shell({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <main className="screen-minh px-5 pb-10 pt-4 sm:px-8 sm:pt-8">
      <div className="mx-auto w-full max-w-[640px]">
        <div className="flex items-center justify-between text-[12px] font-bold text-white/55">
          <span>チュートリアル</span>
          <span className="tnum">{index + 1} / {TUTORIAL_STEPS.length}</span>
        </div>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {TUTORIAL_STEPS.map((s, i) => (
            <span key={s.key} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-gradient-to-r from-pink-400 to-fuchsia-500" : "bg-white/10"}`} />
          ))}
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}

const Primary = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <button onClick={onClick} className="mt-6 w-full rounded-full bg-white px-6 py-3.5 text-[15px] font-bold text-black hover:bg-white/90">{children}</button>
);

const NumberedList = ({ items }: { items: string[] }) => (
  <ol className="mt-5 space-y-2 text-[13.5px] text-white/80">
    {items.map((t, i) => (
      <li key={t} className="flex items-center gap-3 rounded-xl bg-white/[0.05] px-4 py-3">
        <span className="tnum flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-[12px] font-bold">{i + 1}</span>{t}
      </li>
    ))}
  </ol>
);

export default function TutorialPage() {
  const router = useRouter();
  const [step, setStep] = useState<TutorialStep | null>(null);

  useEffect(() => {
    const s = getTutorial().step;
    if (s === "done") router.replace("/");
    else setStep(s);
  }, [router]);

  const go = (next: TutorialStep) => { saveTutorial({ step: next }); setStep(next); window.scrollTo({ top: 0 }); };

  if (step === null || step === "done") return null;
  const index = TUTORIAL_STEPS.findIndex((s) => s.key === step);

  if (step === "welcome") {
    return (
      <Shell index={index}>
        <h1 className="text-grad text-[28px] font-extrabold leading-tight tracking-tight">はじめての面談を、一緒に</h1>
        <p className="mt-3 text-[14px] leading-[1.9] text-white/75">
          約15分で、面談の型を知り、佐藤 美咲さんと1回面談して、振り返りまでを体験します。画面の案内に沿って、1つずつ進めてください。
        </p>
        <NumberedList items={["面談の型を知る", "主訴クイズ（3問）", "佐藤さんと面談（ミッションつき）", "口頭試問と、結果の確認"]} />
        <Primary onClick={() => go("model")}>はじめる</Primary>
      </Shell>
    );
  }

  if (step === "model") {
    return (
      <Shell index={index}>
        <h1 className="text-grad text-[26px] font-extrabold leading-tight tracking-tight">面談の型：三層モデル</h1>
        <p className="mt-3 text-[14px] leading-[1.9] text-white/75">
          相談者の話は、3つの層に分けて聴くと、整理しやすくなります。表の話から、少しずつ、深いところへ。
        </p>
        <div className="mt-5 space-y-3">
          {LAYERS.map((l, i) => (
            <div key={l.name} className="glass rounded-2xl p-4" style={{ borderTop: `3px solid ${l.color}` }}>
              <div className="flex items-baseline gap-3">
                <span className="tnum text-[12px] font-bold text-white/45">{i + 1}</span>
                <span className="text-[17px] font-extrabold" style={{ color: l.color }}>{l.name}</span>
                <span className="text-[13px] text-white/65">{l.hint}</span>
              </div>
            </div>
          ))}
        </div>
        <Primary onClick={() => go("quiz")}>次へ</Primary>
      </Shell>
    );
  }

  if (step === "quiz") return <QuizStep index={index} onDone={() => go("practice")} />;

  if (step === "practice") {
    return (
      <Shell index={index}>
        <h1 className="text-grad text-[26px] font-extrabold leading-tight tracking-tight">佐藤さんと、面談してみよう</h1>
        <p className="mt-3 text-[14px] leading-[1.9] text-white/75">
          会社員の佐藤 美咲さん（28歳）が、キャリアの悩みを話します。画面の上に、ミッションが出ます。
        </p>
        <NumberedList items={MISSIONS.map((m) => m.title)} />
        <p className="mt-3 text-[12.5px] leading-[1.8] text-white/55">あなたが1回話すたびに、次のミッションへ進みます。</p>
        <p className="mt-4 text-[12.5px] leading-[1.8] text-white/55">終わったら、面接官から、2つだけ質問されます。</p>
        <Primary onClick={() => router.push("/session?tutorial=1")}>面談をはじめる</Primary>
      </Shell>
    );
  }

  return <ResultStep index={index} onFinish={() => { saveTutorial({ step: "done" }); router.push("/"); }} />;
}

/* ── 主訴クイズ（3問） ── */
function QuizStep({ index, onDone }: { index: number; onDone: () => void }) {
  const questions = useMemo(() => QUIZ_GROUPS.find((g) => g.id === "complaint")?.questions.slice(0, TUTORIAL_QUIZ_COUNT) ?? [], []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const q = questions[i];
  if (!q) return null;
  const answered = picked !== null;
  const ok = picked === q.answer;

  return (
    <Shell index={index}>
      <h1 className="text-grad text-[24px] font-extrabold leading-tight tracking-tight">主訴クイズ　{i + 1} / {questions.length}</h1>
      <p className="mt-1 text-[12.5px] text-white/55">相談者の「主訴」として、最も適切なものを選んでください。</p>
      <section className="glass mt-4 rounded-2xl p-4">
        <p className="text-[10px] font-bold tracking-wider text-white/45">相談者の語り</p>
        <p className="mt-1 text-[14px] leading-[1.75] text-white/90">{q.scene}</p>
      </section>
      <div className="mt-3 space-y-2">
        {q.choices.map((c, k) => {
          let style = "bg-white/[0.06] hover:bg-white/10 text-white/85";
          if (answered) style = k === q.answer ? "bg-[#5FD3A0]/15 text-white ring-2 ring-[#5FD3A0]" : k === picked ? "bg-[#FF8A80]/15 text-white ring-2 ring-[#FF8A80]" : "bg-white/[0.04] text-white/45";
          return (
            <button key={k} disabled={answered} onClick={() => setPicked(k)} className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13.5px] leading-[1.6] ${style}`}>
              <span className="mt-px flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/15 text-[11px] font-bold">{"ABCD"[k]}</span>
              <span className="min-w-0 flex-1">{c}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-4">
          <p className={`text-[16px] font-extrabold ${ok ? "text-[#7EE0B5]" : "text-[#FF8A80]"}`}>{ok ? "○ 正解です" : "× 不正解です"}</p>
          <ol className="mt-2 space-y-1.5 text-[13px] leading-[1.7] text-white/80">
            {q.steps.map((s, k) => <li key={k} className="flex gap-2"><span className="tnum text-white/45">{k + 1}</span><span>{s}</span></li>)}
          </ol>
          <Primary onClick={() => { if (i + 1 >= questions.length) onDone(); else { setI(i + 1); setPicked(null); window.scrollTo({ top: 0 }); } }}>
            {i + 1 >= questions.length ? "面談へ進む" : "次の問題へ"}
          </Primary>
        </div>
      )}
    </Shell>
  );
}

/* ── 結果 ── */
function ResultStep({ index, onFinish }: { index: number; onFinish: () => void }) {
  const [records, setRecords] = useState<SessionRecord[] | null>(null);
  useEffect(() => {
    try { setRecords(JSON.parse(localStorage.getItem("sessionHistory") ?? "[]")); } catch { setRecords([]); }
  }, []);
  if (records === null) return null;
  const overall = getOverall(records);
  const challenge = getChallenge(records);
  const latest = records[0];

  return (
    <Shell index={index}>
      <h1 className="text-grad text-[26px] font-extrabold leading-tight tracking-tight">おつかれさまでした</h1>
      <p className="mt-2 text-[14px] leading-[1.9] text-white/75">はじめての面談が、できました。いまの力は、こちらです。</p>
      <div className="glass mt-5 rounded-2xl p-5">
        <OverallBar overall={overall} />
        <div className="mt-5 text-[11px] font-bold text-white/45">今日のチャレンジ</div>
        <div className="mt-0.5 text-[20px] font-extrabold text-white">{challenge.title}</div>
      </div>
      {latest && (
        <Link href={`/history?open=${encodeURIComponent(latest.id)}`} onClick={() => { saveTutorial({ step: "done" }); saveSettings({ historyView: "basic" }); }} /* チュートリアルのあとは、Free */ className="mt-4 block rounded-xl bg-white/10 py-3 text-center text-[13.5px] font-semibold text-white/85 hover:bg-white/15">
          振り返りシートを見る
        </Link>
      )}
      <Primary onClick={onFinish}>ホームへ</Primary>
    </Shell>
  );
}
