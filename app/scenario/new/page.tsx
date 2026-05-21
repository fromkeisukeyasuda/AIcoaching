"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scenario } from "@/types";

const ICON_OPTIONS = [
  "💼", "👔", "🏢", "💡", "🎯", "🚀", "⚖️", "👥",
  "🌱", "💪", "🔑", "🧭", "🎓", "💬", "❤️", "🌟",
  "🔥", "🧩", "📈", "🤝", "🏆", "✨", "🎨", "🌈",
];

interface FormData {
  title: string;
  clientName: string;
  clientRole: string;
  situation: string;
  emotion: string;
  description: string;
  tags: string;
  icon: string;
}

const EMPTY_FORM: FormData = {
  title: "",
  clientName: "",
  clientRole: "",
  situation: "",
  emotion: "",
  description: "",
  tags: "",
  icon: "💼",
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
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
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
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function NewScenarioPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saved, setSaved] = useState(false);

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
      icon: form.icon,
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
    "w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-700 outline-none transition-all placeholder-slate-300";
  const inputNormal = "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  const inputError = "border-red-300 ring-2 ring-red-100";

  const inputClass = (field: keyof FormData) =>
    `${inputBase} ${errors[field] ? inputError : inputNormal}`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* ページヘッダー */}
        <div className="mb-10">
          <Link
            href="/session"
            className="inline-flex items-center text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            シナリオ一覧に戻る
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">シナリオを作成</h1>
          <p className="text-slate-500 text-sm">4つのステップで練習シナリオを設定できます</p>
        </div>

        <div className="space-y-4">

          {/* STEP 1: 見た目 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <SectionHeader
              step="1"
              title="見た目の設定"
              description="シナリオ一覧に表示するアイコンとタイトルを決めます"
            />
            <div className="space-y-5">
              <div>
                <FieldLabel label="アイコン" />
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, icon: emoji }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        form.icon === emoji
                          ? "bg-indigo-100 ring-2 ring-indigo-400 scale-110"
                          : "bg-slate-50 hover:bg-slate-100 border border-slate-100"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
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
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.situation}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-5">
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
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 pt-5">
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
                        className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full"
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
            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
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
            className="px-5 py-3 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            キャンセル
          </Link>
        </div>

      </div>
    </main>
  );
}
