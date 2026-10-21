import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { deleteUser, readUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "利用状況", robots: { index: false, follow: false } };

const fmt = (iso: string) =>
  iso
    ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso))
    : "—";

const pct = (c: number, n: number) => (n ? `${Math.round((c / n) * 100)}%` : "—");

const th: React.CSSProperties = { textAlign: "right", padding: "8px 10px", fontSize: 11.5, color: "#8F8AA8", fontWeight: 700, whiteSpace: "nowrap" };
const td: React.CSSProperties = { textAlign: "right", padding: "9px 10px", fontSize: 13, borderTop: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap" };
const card: React.CSSProperties = { background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "18px 20px", overflowX: "auto" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key = "" } = await searchParams;
  const adminKey = process.env.ADMIN_KEY;

  if (!adminKey) {
    return <main style={{ padding: 32 }}>環境変数 ADMIN_KEY が設定されていません。Vercel に ADMIN_KEY（好きな合言葉）を登録して、再デプロイしてください。</main>;
  }
  if (key !== adminKey) {
    return <main style={{ padding: 32 }}>アクセスできません。URL の末尾に <code>?key=合言葉</code> を付けてください。</main>;
  }

  async function remove(formData: FormData) {
    "use server";
    if (String(formData.get("key")) !== process.env.ADMIN_KEY) return;
    await deleteUser(String(formData.get("uid")));
    revalidatePath("/admin");
  }

  const data = await readUsage(14);
  if (!data) {
    return <main style={{ padding: 32 }}>Redis に接続できません（REDIS_URL を確認してください）。</main>;
  }

  const { users, daily } = data;
  const total = users.reduce(
    (a, u) => ({
      sessions: a.sessions + u.practiceSessions + u.consultSessions,
      turns: a.turns + u.practiceTurns + u.consultTurns,
      evals: a.evals + u.evals,
      quizAnswers: a.quizAnswers + u.quizAnswers,
      quizCorrect: a.quizCorrect + u.quizCorrect,
    }),
    { sessions: 0, turns: 0, evals: 0, quizAnswers: 0, quizCorrect: 0 }
  );

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 20px 80px", display: "flex", flexDirection: "column", gap: 18 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800 }}>利用状況</h1>
      <p style={{ fontSize: 12.5, color: "#8F8AA8", margin: 0 }}>
        利用者は、匿名のIDで区別しています。会話の内容は、記録していません。ブラウザのデータを消した人や、別の端末は、別の利用者になります。
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {[
          ["利用者", users.length],
          ["セッション合計", total.sessions],
          ["会話ターン合計", total.turns],
          ["評価の作成", total.evals],
          ["クイズ 回答", total.quizAnswers],
          ["クイズ 正答率", pct(total.quizCorrect, total.quizAnswers)],
        ].map(([label, value]) => (
          <div key={String(label)} style={card}>
            <div style={{ fontSize: 11.5, color: "#8F8AA8", fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{value}</div>
          </div>
        ))}
      </div>

      <section style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>利用者ごと（最後に使った順）</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>利用者ID</th>
              <th style={th}>初回</th>
              <th style={th}>最後</th>
              <th style={th}>練習 セッション</th>
              <th style={th}>練習 ターン</th>
              <th style={th}>相談 セッション</th>
              <th style={th}>相談 ターン</th>
              <th style={th}>評価</th>
              <th style={th}>クイズ 回答</th>
              <th style={th}>クイズ 正解</th>
              <th style={th}>クイズ 正答率</th>
              <th style={th}></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td style={{ ...td, textAlign: "left" }} colSpan={12}>まだ記録がありません。</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.uid}>
                <td style={{ ...td, textAlign: "left", fontFamily: "monospace" }}>{u.uid}</td>
                <td style={td}>{fmt(u.first)}</td>
                <td style={td}>{fmt(u.last)}</td>
                <td style={td}>{u.practiceSessions}</td>
                <td style={td}>{u.practiceTurns}</td>
                <td style={td}>{u.consultSessions}</td>
                <td style={td}>{u.consultTurns}</td>
                <td style={td}>{u.evals}</td>
                <td style={td}>{u.quizAnswers}</td>
                <td style={td}>{u.quizCorrect}</td>
                <td style={td}>{pct(u.quizCorrect, u.quizAnswers)}</td>
                <td style={td}>
                  <form action={remove}>
                    <input type="hidden" name="key" value={key} />
                    <input type="hidden" name="uid" value={u.uid} />
                    <button type="submit" style={{ fontSize: 11, color: "#8F8AA8", background: "transparent", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, padding: "3px 10px", cursor: "pointer" }}>削除</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 8px" }}>日ごと（直近14日、日本時間）</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: "left" }}>日付</th>
              <th style={th}>利用者数</th>
              <th style={th}>セッション</th>
              <th style={th}>会話ターン</th>
              <th style={th}>評価</th>
            </tr>
          </thead>
          <tbody>
            {daily.map((d) => (
              <tr key={d.date}>
                <td style={{ ...td, textAlign: "left" }}>{d.date}</td>
                <td style={td}>{d.users}</td>
                <td style={td}>{d.sessions}</td>
                <td style={td}>{d.turns}</td>
                <td style={td}>{d.evals}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
