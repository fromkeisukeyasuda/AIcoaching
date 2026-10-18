'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Answer, SilenceType } from './types';

// ---- 設問定義 ----

interface Question {
  id: number;
  text: string;
  type: 'scale' | 'options';
  options?: string[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: '本当の意味で、あなたの決断を理解してくれる人が社内にいると感じますか？',
    type: 'scale',
  },
  {
    id: 2,
    text: '目標を達成した瞬間、次の瞬間にどんな気持ちになりますか？',
    type: 'options',
    options: ['すぐ次へ動く', '少し満足するがすぐ不安', '何かが足りず虚しい'],
  },
  {
    id: 3,
    text: '「経営者」という役割を外したとき、あなた自身は何者か、すぐに答えが浮かびましたか？',
    type: 'scale',
  },
  {
    id: 4,
    text: 'ここ3ヶ月で、誰にも言えなかった本音が何個ありましたか？',
    type: 'options',
    options: ['0-1個', '2-3個', '4-5個', '6個以上'],
  },
  {
    id: 5,
    text: '10年後の自分が誇れることを、今やっていると思いますか？',
    type: 'scale',
  },
  {
    id: 6,
    text: '仕事の時間のうち、本当にやりたいことをやっている時間は何割ですか？',
    type: 'options',
    options: ['8割以上', '6-7割', '4-5割', '2-3割', '1割以下'],
  },
  {
    id: 7,
    text: '今の仕事を続ける一番の理由は何ですか？',
    type: 'options',
    options: ['純粋に好きだから', '使命感がある', '責任があるから', 'やめ方がわからない', 'ほぼ惰性'],
  },
  {
    id: 8,
    text: 'パートナーや家族は、あなたが今どんなことに悩んでいるか知っていると思いますか？',
    type: 'scale',
  },
  {
    id: 9,
    text: '最近の重要な決断で、あとで「本当はそうしたくなかった」と思ったものがありますか？',
    type: 'scale',
  },
  {
    id: 10,
    text: '引退後の自分を想像すると、最初に湧く感情は何ですか？',
    type: 'options',
    options: ['解放感', '達成感', '恐怖', '虚無', 'わからない'],
  },
];

// ---- タイプ判定ロジック ----

function determineType(answers: Answer[]): SilenceType {
  const score = (ids: number[]) =>
    answers
      .filter((a) => ids.includes(a.questionId))
      .reduce((sum, a) => sum + a.value, 0);

  const scores: Record<SilenceType, number> = {
    relation:   score([1, 3, 8]),
    existence:  score([1, 3, 8]),
    meaning:    score([2, 5, 10]),
    awakening:  score([2, 5, 10]),
    limit:      score([4, 9]),
    time:       score([6, 7]),
  };

  // Q1,Q3,Q8 の平均が高ければ relation、低ければ existence
  const relScore = answers.filter((a) => [1, 3, 8].includes(a.questionId)).reduce((s, a) => s + a.value, 0);
  const relAvg = relScore / 3;
  scores.relation   = relAvg >= 3 ? relScore : 0;
  scores.existence  = relAvg < 3  ? (15 - relScore) : 0;

  // Q2,Q5,Q10 の平均が高ければ meaning、低ければ awakening
  const menScore = answers.filter((a) => [2, 5, 10].includes(a.questionId)).reduce((s, a) => s + a.value, 0);
  const menAvg = menScore / 3;
  scores.meaning    = menAvg >= 3 ? menScore : 0;
  scores.awakening  = menAvg < 3  ? (15 - menScore) : 0;

  const winner = (Object.keys(scores) as SilenceType[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );

  return winner;
}

// ---- フェーズ型 ----

type Phase = 'intro' | 'questions' | 'loading' | 'result';

// ---- コンポーネント ----

export default function DiagnosePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex) / QUESTIONS.length) * 100;

  // 回答を記録して次へ
  const handleAnswer = (value: number) => {
    setSelected(value);
  };

  const handleNext = () => {
    if (selected === null) return;

    const newAnswers: Answer[] = [
      ...answers,
      { questionId: currentQuestion.id, value: selected },
    ];
    setAnswers(newAnswers);
    setSelected(null);

    if (currentIndex + 1 < QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      // 全問完了 → loading → result
      setPhase('loading');
      setTimeout(() => {
        const type = determineType(newAnswers);
        router.push(`/diagnose/result/${type}`);
      }, 2800);
    }
  };

  const handleStart = () => {
    setPhase('questions');
    setCurrentIndex(0);
    setAnswers([]);
    setSelected(null);
  };

  // ---- イントロ画面 ----
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-6 text-center">
        <div className="max-w-lg w-full space-y-10">
          {/* タイトル */}
          <div className="space-y-4">
            <p className="text-slate-400 text-sm tracking-[0.3em] uppercase">Silence Diagnosis</p>
            <h1
              className="text-5xl font-bold text-white leading-tight"
              style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", serif' }}
            >
              沈黙の問い
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              誰にも言えなかったことに、<br />名前をつける診断。
            </p>
          </div>

          {/* 区切り線 */}
          <div className="w-16 h-px bg-slate-600 mx-auto" />

          {/* 説明文 */}
          <p className="text-slate-400 text-base leading-relaxed">
            経営者が本当に悩んでいることは、<br />
            会議では語られない。<br />
            その沈黙の中にある問いを、言語化する。
          </p>

          {/* 所要時間 */}
          <p className="text-slate-500 text-sm tracking-widest">5〜7分 · 全10問</p>

          {/* はじめるボタン */}
          <button
            onClick={handleStart}
            className="w-full max-w-xs mx-auto block bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0 text-base tracking-wide"
          >
            診断をはじめる
          </button>
        </div>
      </div>
    );
  }

  // ---- ローディング画面 ----
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 px-6 text-center">
        <div className="space-y-8">
          <p className="text-slate-300 text-xl tracking-wide">
            あなたの沈黙を読み解いています
          </p>
          {/* 3点ドットアニメーション */}
          <div className="flex justify-center gap-3">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce [animation-delay:0ms]" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce [animation-delay:150ms]" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  // ---- 設問画面 ----
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white">
      {/* プログレスバー */}
      <div className="w-full bg-slate-800 h-1">
        <div
          className="h-1 bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 設問カウンター */}
      <div className="px-6 pt-6 pb-2 flex items-center justify-between">
        <span className="text-slate-500 text-sm">
          {currentIndex + 1} <span className="text-slate-700">/</span> 10
        </span>
        <span className="text-slate-600 text-xs tracking-widest">沈黙の問い</span>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col justify-center px-6 py-8 max-w-lg mx-auto w-full">
        {/* 設問文 */}
        <h2
          className="text-white text-xl leading-relaxed mb-10 font-medium"
          style={{ fontFamily: '"Noto Serif JP", "Yu Mincho", serif' }}
        >
          {currentQuestion.text}
        </h2>

        {/* スケール型（1〜5） */}
        {currentQuestion.type === 'scale' && (
          <div className="space-y-4">
            <div className="flex gap-3 justify-between">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => handleAnswer(val)}
                  className={`flex-1 aspect-square rounded-xl text-base font-semibold transition-all duration-200 border
                    ${selected === val
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-105'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between px-1">
              <span className="text-slate-600 text-xs">全くない</span>
              <span className="text-slate-600 text-xs">強くそう感じる</span>
            </div>
          </div>
        )}

        {/* 選択肢型 */}
        {currentQuestion.type === 'options' && currentQuestion.options && (
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              // 選択肢インデックスを 1〜5 にマッピング（最大5）
              const value = idx + 1;
              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(value)}
                  className={`w-full text-left px-5 py-4 rounded-xl text-base transition-all duration-200 border
                    ${selected === value
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                >
                  <span className="mr-3 text-slate-500 text-sm">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {/* 次へボタン */}
        <div className="mt-10">
          <button
            onClick={handleNext}
            disabled={selected === null}
            className={`w-full py-4 rounded-full font-semibold text-base tracking-wide transition-all duration-300
              ${selected !== null
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 active:translate-y-0'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
          >
            {currentIndex + 1 < QUESTIONS.length ? '次の問いへ' : '結果を見る'}
          </button>
        </div>
      </div>
    </div>
  );
}
