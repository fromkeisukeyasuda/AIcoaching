"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scenario } from "@/types";
import { AVATAR_OPTIONS, DEFAULT_AVATAR } from "@/lib/avatars";
import { getSettings, planOf } from "@/lib/settings";

interface FormData {
  title: string;
  clientName: string;
  clientRole: string;
  situation: string;
  emotion: string;
  description: string;
  tags: string;
  avatar: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  clientName: "",
  clientRole: "",
  situation: "",
  emotion: "",
  description: "",
  tags: "",
  avatar: DEFAULT_AVATAR,
};

function SectionHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-white/45 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FieldLabel({
  label,
  hint,
  required,
}: {
  label: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-1.5">
      <label className="text-sm font-medium text-white/90">
        {label}
        {required && <span className="text-red-300 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-white/45 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function NewScenarioPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saved, setSaved] = useState(false);

  // シナリオの作成は、Pro だけ。Free は、練習の画面へ戻す
  useEffect(() => {
    if (planOf(getSettings().historyView) === "free") router.replace("/session");
  }, [router]);

  const set =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const validate = () => {
    const next: Partial<FormData> = {};
    if (!form.title.trim()) next.title = "入力してください";
    if (!form.clientName.trim()) next.clientName = "入力してください";
    if (!form.clientRole.trim()) next.clientRole = "入力してください";
    if (!form.situation.trim()) next.situation = "入力してください";
    if (!form.emotion.trim()) next.emotion = "入力してください";
    if (!form.description.trim()) next.description = "入力してください";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const stored = localStorage.getItem("customScenarios");
    const existing: Scenario[] = stored ? JSON.parse(stored) : [];

    const newScenario: Scenario = {
      id: `custom-${Date.now()}`,
      title: form.title.trim(),
      clientName: form.clientName.trim(),
      clientRole: form.clientRole.trim(),
      situation: form.situation.trim(),
      emotion: form.emotion.trim(),
      description: form.description.trim(),
      tags: form.tags
        .split(/[,、]/)
        .map((t) => t.trim())
        .filter(Boolean),
      icon: "👤", // 画像が読み込めないときの代わり
      avatar: form.avatar,
      isCustom: true,
    };

    localStorage.setItem(
      "customScenarios",
      JSON.stringify([...existing, newScenario])
    );

    setSaved(true);
    setTimeout(() => router.push("/session"), 800);
  };

  const inputBase =
    "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-[#1d1a2e] text-white/90 outline-none transition-all placeholder-white/25";
  const inputNormal = "border-white/10 focus:border-pink-300 focus:ring-2 focus:ring-pink-300/20";
  const inputError = "border-red-300/40 ring-2 ring-red-300/30";

  const inputClass = (field: keyof FormData) =>
    `${inputBase} ${errors[field] ? inputError : inputNormal}`;

  return (
    <main className="screen-minh">
      <div className="reveal max-w-2xl mx-auto px-5 sm:px-6 py-10 sm:py-14">

        {/* ページヘッダー */}
        <div className="mb-10">
          <Link
            href="/session"
            className="inline-flex items-center text-sm text-white/45 hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            シナリオ一覧に戻る
          </Link>
          <h1 className="text-grad mb-2 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">シナリオを作成</h1>
          <p className="text-white/60 text-sm">4つのステップで練習シナリオを設定できます</p>
        </div>

        <div className="space-y-4">

          {/* STEP 1: 見た目 */}
          <div className="bg-[#1d1a2e] rounded-2xl shadow-sm border border-white/5 p-6">
            <SectionHeader
              step="1"
              title="見た目の設定"
              description="相談者の見た目とタイトルを決めます"
            />
            <div className="space-y-5">
              <div>
                <FieldLabel label="見た目" />
                <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="相談者の見た目">
                  {AVATAR_OPTIONS.map((a) => {
                    const selected = form.avatar === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setForm((prev) => ({ ...prev, avatar: a.id }))}
                        className={`overflow-hidden rounded-2xl text-left transition-all ${
                          selected ? "ring-2 ring-pink-300 bg-pink-400/10" : "bg-[#14121f] border border-white/5 hover:bg-white/10"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.src} alt={a.name} className="aspect-square w-full object-cover" style={{ objectPosition: "50% 20%" }} />
                        <div className={`px-3 py-2 text-center text-sm font-semibold ${selected ? "text-pink-200" : "text-white/70"}`}>{a.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <FieldLabel
                  label="シナリオタイトル"
                  hint="例：新規事業立ち上げ、部下育成、人間関係の改善"
                  required
                />
                <input
                  type="text"
                  value={form.title}
                  onChange={set("title")}
                  placeholder="チームマネジメント"
                  className={inputClass("title")}
                />
                {errors.title && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: クライアント情報 */}
          <div className="bg-[#1d1a2e] rounded-2xl shadow-sm border border-white/5 p-6">
            <SectionHeader
              step="2"
              title="クライアント情報"
              description="AIが演じるクライアントのプロフィールを設定します"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel label="クライアント名" hint="例：田中 誠" required />
                <input
                  type="text"
                  value={form.clientName}
                  onChange={set("clientName")}
                  placeholder="山田 太郎"
                  className={inputClass("clientName")}
                />
                {errors.clientName && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.clientName}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel label="役割・属性" hint="例：30代のマネージャー" required />
                <input
                  type="text"
                  value={form.clientRole}
                  onChange={set("clientRole")}
                  placeholder="40代の営業部長"
                  className={inputClass("clientRole")}
                />
                {errors.clientRole && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.clientRole}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 3: シナリオの中身 */}
          <div className="bg-[#1d1a2e] rounded-2xl shadow-sm border border-white/5 p-6">
            <SectionHeader
              step="3"
              title="シナリオの内容"
              description="クライアントの状況と内面を詳しく書くほど、よりリアルな会話になります"
            />
            <div className="space-y-5">
              <div>
                <FieldLabel
                  label="状況・背景"
                  hint="クライアントが抱えている課題や置かれている状況を具体的に"
                  required
                />
                <textarea
                  value={form.situation}
                  onChange={set("situation")}
                  placeholder="例：新しいプロジェクトのリーダーに任命されたが、メンバーとの関係構築に苦労している。チームの方向性が定まらず、プロジェクトが停滞している。"
                  rows={4}
                  className={`${inputClass("situation")} resize-none`}
                />
                {errors.situation && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.situation}
                  </p>
                )}
              </div>

              <div className="border-t border-white/5 pt-5">
                <FieldLabel
                  label="感情・気持ち"
                  hint="クライアントの内面的な状態（不安・焦り・迷いなど）を書いてください"
                  required
                />
                <textarea
                  value={form.emotion}
                  onChange={set("emotion")}
                  placeholder="例：責任の重さにプレッシャーを感じている。周囲の期待に応えたいが、どこから手をつければいいか分からず焦りを感じている。"
                  rows={3}
                  className={`${inputClass("emotion")} resize-none`}
                />
                {errors.emotion && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.emotion}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* STEP 4: 一覧表示用 */}
          <div className="bg-[#1d1a2e] rounded-2xl shadow-sm border border-white/5 p-6">
            <SectionHeader
              step="4"
              title="一覧への表示情報"
              description="シナリオ選択画面に表示される説明とタグを設定します"
            />
            <div className="space-y-5">
              <div>
                <FieldLabel
                  label="シナリオの説明"
                  hint="1〜2文でシナリオの内容を要約してください"
                  required
                />
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="例：新任リーダーとしてチームをまとめることに苦労しているビジネスパーソンです。"
                  rows={2}
                  className={`${inputClass("description")} resize-none`}
                />
                {errors.description && (
                  <p className="text-xs text-red-300 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="border-t border-white/5 pt-5">
                <FieldLabel
                  label="タグ（任意）"
                  hint="カンマまたは読点で区切って入力"
                />
                <input
                  type="text"
                  value={form.tags}
                  onChange={set("tags")}
                  placeholder="例：リーダーシップ、プロジェクト管理、コミュニケーション"
                  className={inputClass("tags")}
                />
                {form.tags && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.split(/[,、]/).filter((t) => t.trim()).map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs text-pink-300 bg-pink-400/10 px-2.5 py-1 rounded-full"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saved}
            className="flex-1 py-3 bg-gradient-to-br from-pink-400 to-fuchsia-500 hover:opacity-90 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                保存しました — シナリオ一覧へ移動中...
              </>
            ) : (
              "シナリオを保存する"
            )}
          </button>
          <Link
            href="/session"
            className="px-5 py-3 bg-[#1d1a2e] text-white/75 text-sm font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
          >
            キャンセル
          </Link>
        </div>

      </div>
    </main>
  );
}
