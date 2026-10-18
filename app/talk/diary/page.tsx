"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { coaches } from "@/lib/coaches";
import { DiaryEntry, TalkProfile, clearProfile, deleteDiary, getDiary, getProfile } from "@/lib/talkStore";

function formatDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  const w = ["日", "月", "火", "水", "木", "金", "土"][new Date(y, m - 1, day).getDay()];
  return `${y}/${m}/${day}（${w}）`;
}

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [profile, setProfile] = useState<TalkProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(getDiary());
    setProfile(getProfile());
    setLoaded(true);
  }, []);

  const remove = (id: string) => {
    if (!confirm("この日記を削除しますか？（コーチの記憶からも消えます）")) return;
    deleteDiary(id);
    setEntries(getDiary());
  };

  const resetProfile = () => {
    if (!confirm("呼び名と年代をリセットします。次に話すとき、もう一度聞かれます。")) return;
    clearProfile();
    setProfile(null);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#14121f] text-white px-5 py-8">
      <div className="max-w-xl mx-auto">
        <Link href="/talk" className="text-xs text-white/60 hover:text-white">← 話す</Link>
        <h1 className="mt-3 text-2xl font-bold">日記</h1>
        <p className="mt-1 mb-6 text-sm text-white/50">会話の要点が自動で残ります。コーチは新しい3件までを覚えていて、次の会話で触れます。</p>

        {loaded && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm">
            <div className="text-white/80">
              <span className="text-white/45 text-xs mr-2">プロフィール</span>
              {profile ? `${profile.nickname || "呼び名なし"} ／ ${profile.ageGroup || "年代未回答"}` : "未設定（次に話すときに聞かれます）"}
            </div>
            {profile && <button onClick={resetProfile} className="text-xs text-pink-300 hover:text-pink-200 whitespace-nowrap">リセット</button>}
          </div>
        )}

        {loaded && entries.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm text-white/45">
            まだ日記はありません。相談モードで2回以上話すと、残ります。
          </p>
        )}

        <div className="space-y-4">
          {entries.map((e) => {
            const coach = coaches.find((c) => c.id === e.coachId);
            return (
              <article key={e.id} className="rounded-2xl bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  {coach && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coach.images.idle} alt={coach.name} className="h-10 w-10 rounded-full object-cover" style={{ objectPosition: "50% 20%" }} />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold">{formatDate(e.date)}</p>
                    <p className="text-[11px] text-white/50">{coach?.name ?? "コーチ"}と話した</p>
                  </div>
                  {e.mood && <span className="rounded-full bg-pink-400/20 px-2.5 py-1 text-[11px] text-pink-200">{e.mood}</span>}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/90">{e.summary}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {e.topics.map((t) => (
                      <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">#{t}</span>
                    ))}
                  </div>
                  <button onClick={() => remove(e.id)} className="text-[11px] text-white/35 hover:text-red-300">削除</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
