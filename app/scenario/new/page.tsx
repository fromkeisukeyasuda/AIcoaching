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

function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

export default function NewScenarioPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [saved, setSaved] = useState(false);

  const set = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const next: Partial<FormData> = {};
    if (!form.title.trim()) next.title = "タイトルは必須です";
    if (!form.clientName.trim()) next.clientName = "クライアント名は必須です";
    if (!form.clientRole.trim()) next.clientRole = "役割・属性は必須です";
    if (!form.situation.trim()) next.situation = "状況・背景は必須です";
    if (!form.emotion.trim()) next.emotion = "感情・気持ちは必須です";
    if (!form.description.trim()) next.description = "説明文は必須です";
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

  const inputClass = (field: keyof FormData) =>
    `w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-slate-700 outline-none transition-all ${
      errors[field]
        ? "border-red-300 ring-2 ring-red-100"
        : "border-slate-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
    }`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
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
          <p className="text-slate-500 text-sm">練習したいシナリオの情報を入力してください</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          {/* アイコン選択 */}
          <FormField label="アイコン">
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, icon: emoji }))}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.icon === emoji
                      ? "bg-indigo-100 ring-2 ring-indigo-400 scale-110"
                      : "bg-slate-50 hover:bg-slate-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </FormField>

          {/* タイトル */}
          <FormField label="シナリオタイトル" required hint="例：新規事業立ち上げ、部下育成、人間関係の改善">
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="チームマネジメント"
              className={inputClass("title")}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </FormField>

          {/* クライアント名 + 役割 */}
          <div className="grid sm:grid-cols-2 gap-4">
            <FormField label="クライアント名" required hint="例：田中 誠">
              <input
                type="text"
                value={form.clientName}
                onChange={set("clientName")}
                placeholder="山田 太郎"
                className={inputClass("clientName")}
              />
              {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName}</p>}
            </FormField>

            <FormField label="役割・属性" required hint="例：30代のマネージャー">
              <input
                type="text"
                value={form.clientRole}
                onChange={set("clientRole")}
                placeholder="40代の営業部長"
                className={inputClass("clientRole")}
              />
              {errors.clientRole && <p className="text-xs text-red-500 mt-1">{errors.clientRole}</p>}
            </FormField>
          </div>

          {/* 状況・背景 */}
          <FormField
            label="状況・背景"
            required
            hint="クライアントが置かれている状況や、抱えている課題を具体的に書いてください"
          >
            <textarea
              value={form.situation}
              onChange={set("situation")}
              placeholder="新しいプロジェクトのリーダーに任命されたが、メンバーとの関係構築に苦労している。チームの方向性が定まらず、プロジェクトが停滞している。"
              rows={4}
              className={inputClass("situation") + " resize-none"}
            />
            {errors.situation && <p className="text-xs text-red-500 mt-1">{errors.situation}</p>}
          </FormField>

          {/* 感情・気持ち */}
          <FormField
            label="感情・気持ち"
            required
            hint="クライアントの内面的な状態を書いてください"
          >
            <textarea
              value={form.emotion}
              onChange={set("emotion")}
              placeholder="責任の重さにプレッシャーを感じている。周囲の期待に応えたいが、どこから手をつければいいか分からず焦りを感じている。"
              rows={3}
              className={inputClass("emotion") + " resize-none"}
            />
            {errors.emotion && <p className="text-xs text-red-500 mt-1">{errors.emotion}</p>}
          </FormField>

          {/* 説明文 */}
          <FormField
            label="シナリオの説明"
            required
            hint="シナリオ一覧に表示される短い説明文（1〜2文）"
          >
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="新任リーダーとしてチームをまとめることに苦労しているビジネスパーソンです。"
              rows={2}
              className={inputClass("description") + " resize-none"}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </FormField>

          {/* タグ */}
          <FormField
            label="タグ"
            hint="カンマまたは読点で区切って入力（例：リーダーシップ、チームビルディング）"
          >
            <input
              type="text"
              value={form.tags}
              onChange={set("tags")}
              placeholder="リーダーシップ、プロジェクト管理、コミュニケーション"
              className={inputClass("tags")}
            />
          </FormField>
        </div>

        {/* ボタン */}
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
                保存しました
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
