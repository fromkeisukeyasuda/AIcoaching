"use client";

import { useState, useEffect } from "react";
import { getSettings, saveSettings, VoiceWait, VOICE_WAIT_OPTIONS } from "@/lib/settings";
import { getUid } from "@/lib/track";
import { usedVoiceNames, voiceCredit, VOICEVOX_SITE } from "@/lib/voiceCredit";

/* ── デザイントークン ── */
const V = {
  navy:    "#F5F1FF",
  green:   "#5FD3A0",
  coral:   "#FF8A80",
  coralLt: "rgba(255,138,128,0.14)",
  bg:      "rgba(255,255,255,0.05)",
  surface: "rgba(255,255,255,0.045)",
  ink:     "#FFFFFF",
  ink2:    "#CFC9E4",
  ink3:    "#8F8AA8",
  border:  "rgba(255,255,255,0.07)",
  sans:    '"Plus Jakarta Sans","Noto Sans JP","Hiragino Sans",system-ui,sans-serif',
} as const;

const card: React.CSSProperties = {
  background: V.surface,
  border: `1px solid ${V.border}`,
  borderRadius: 22,
  padding: "28px 30px",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 24px 40px -28px rgba(8,4,24,0.9)",
  backdropFilter: "blur(14px)",
};

const cardTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: V.navy, marginBottom: 14 };

/* ── トグル ── */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 46, height: 26, borderRadius: 13, border: "none", padding: 0,
        background: checked ? V.green : "rgba(255,255,255,0.18)",
        cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 23 : 3,
        width: 20, height: 20, borderRadius: "50%",
        background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        transition: "left 0.2s",
      }} />
    </button>
  );
}

/* ══════════════════════════════════════════════
   マイページ: サポート設定 / クレジット / プライバシー
══════════════════════════════════════════════ */
export default function MyPage() {
  const [hint, setHint] = useState(true);
  const [voice, setVoice] = useState(true);
  const [voiceWait, setVoiceWait] = useState<VoiceWait>("normal");
  const [uid, setUid] = useState("");

  useEffect(() => {
    const st = getSettings();
    setHint(st.hint);
    setVoice(st.voice);
    setVoiceWait(st.voiceWait);
    setUid(getUid());
  }, []);

  // 切り替えたら、その場で保存する
  const changeHint = (v: boolean) => { setHint(v); saveSettings({ hint: v }); };
  const changeVoice = (v: boolean) => { setVoice(v); saveSettings({ voice: v }); };
  const changeVoiceWait = (v: VoiceWait) => { setVoiceWait(v); saveSettings({ voiceWait: v }); };

  const items = [
    { icon: "💡", label: "AIヒント表示", desc: "練習中に「ヒント」ボタンを表示し、押すと、次の一手のヒントをAIが出します。", checked: hint, onChange: changeHint },
    { icon: "🔊", label: "音声読み上げ（TTS）", desc: "相談・練習の返答を音声で読み上げます。VOICEVOXがない場合は、ブラウザの音声を使います。", checked: voice, onChange: changeVoice },
  ];

  return (
    <main className="screen-minh" style={{ background: "transparent", paddingBottom: 64, fontFamily: V.sans }}>
      <div className="rs-px" style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px 0", display: "flex", flexDirection: "column", gap: 18 }}>

        <h1 className="reveal" style={{ fontSize: 34, fontWeight: 800, color: V.navy, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 4px" }}>
          マイページ
        </h1>

        {/* サポート設定 */}
        <section className="reveal" style={{ ...card, ["--i" as string]: 1 } as React.CSSProperties}>
          <div style={cardTitle}>⚙️ サポート設定</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {items.map((item, i) => (
              <div
                key={item.label}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: "15px 0",
                  borderBottom: i < items.length - 1 ? `1px solid ${V.border}` : "none",
                }}
              >
                <div style={{
                  width: 40, height: 40, background: V.bg, borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: V.ink, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: V.ink3 }}>{item.desc}</div>
                </div>
                <Toggle checked={item.checked} onChange={item.onChange} label={item.label} />
              </div>
            ))}
            <div style={{ padding: "15px 0 2px", borderTop: `1px solid ${V.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 40, height: 40, background: V.bg, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎙</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: V.ink, marginBottom: 2 }}>音声入力の待ち時間</div>
                  <div style={{ fontSize: 12, color: V.ink3 }}>話し終えたとみなすまでの、無音の長さです。考えながら話すときは、長めにしてください。「無制限」は、送信ボタンを押すまで、聞き続けます。</div>
                </div>
              </div>
              <div role="radiogroup" aria-label="音声入力の待ち時間" style={{ display: "flex", gap: 8, marginTop: 12 }}>
                {VOICE_WAIT_OPTIONS.map((o) => {
                  const on = voiceWait === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => changeVoiceWait(o.value)}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 12, cursor: "pointer", fontFamily: V.sans,
                        border: on ? `1.5px solid ${V.green}` : `1px solid ${V.border}`,
                        background: on ? "rgba(95,211,160,0.14)" : V.bg,
                        color: on ? V.ink : V.ink2,
                      }}
                    >
                      <div style={{ fontSize: 13.5, fontWeight: 700 }}>{o.label}</div>
                      <div style={{ fontSize: 10.5, color: V.ink3, marginTop: 1 }}>{o.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 利用者ID */}
        <section className="reveal" style={{ ...card, ["--i" as string]: 3 } as React.CSSProperties}>
          <div style={cardTitle}>利用者ID</div>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: V.ink3, lineHeight: 1.8 }}>
            感想や不具合を連絡するときに、このIDを添えてもらえると、状況を確認しやすくなります。名前や連絡先とは、結びついていません。
          </p>
          <span style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: V.ink, background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: "6px 14px", letterSpacing: "0.08em" }}>{uid || "—"}</span>
        </section>

        {/* クレジット */}
        <section className="reveal" style={{ ...card, ["--i" as string]: 2 } as React.CSSProperties}>
          <div style={cardTitle}>クレジット</div>
          <p style={{ margin: "0 0 10px", fontSize: 12.5, color: V.ink3, lineHeight: 1.8 }}>
            音声の合成に、<a href={VOICEVOX_SITE} target="_blank" rel="noopener noreferrer" style={{ color: "#F9A8D4", textDecoration: "none", fontWeight: 600 }}>VOICEVOX</a> を使っています。
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {usedVoiceNames().map((n) => (
              <span key={n} style={{ fontSize: 12, color: V.ink2, background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "5px 12px" }}>{voiceCredit(n)}</span>
            ))}
          </div>
        </section>

        {/* プライバシー */}
        <section className="reveal" style={{ ...card, ["--i" as string]: 3 } as React.CSSProperties}>
          <div style={cardTitle}>🔒 プライバシー</div>
          <div style={{
            background: V.bg, borderRadius: 12, padding: "14px 16px",
            fontSize: 13, color: V.ink2, lineHeight: 1.7, marginBottom: 14,
          }}>
            <strong style={{ color: V.navy }}>保存場所:</strong> 会話・評価・設定は、この端末のブラウザ（ローカルストレージ）にだけ保存します。アプリ側のサーバーには残しません。
            <br />
            <strong style={{ color: V.navy }}>利用状況の記録:</strong> 開発の改善のため、匿名の利用者IDごとに、使った回数（練習・相談の回数と、会話の往復数）だけを記録します。会話の内容は、記録しません。
            <br />
            <strong style={{ color: V.navy }}>外部への送信:</strong> 返答の生成と評価のため、会話の内容をAIサービス（Anthropic、または Google）に送ります。音声読み上げでは、返答の文章を音声合成エンジン（VOICEVOX）に送ります。名前や会社名など、特定できる情報は入力しないでください。
          </div>
          <button
            onClick={() => {
              if (confirm("すべての練習履歴・設定を削除しますか？この操作は取り消せません。")) {
                try {
                  // 相談の会話・プロフィール・レベル（talk_ で始まるもの）と、練習の履歴・設定を、すべて消す
                  const keys = ["sessionHistory", "coachingSession", "mypageSettings", "customScenarios", "rm_uid", "quizProgress", "tutorialProgress"];
                  for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k?.startsWith("talk_")) keys.push(k);
                  }
                  keys.forEach((k) => localStorage.removeItem(k));
                } catch { /* 削除できない環境では、そのまま進む */ }
                alert("データを削除しました。");
                window.location.reload();
              }
            }}
            style={{
              padding: "10px 18px", borderRadius: 10,
              border: `1px solid ${V.coral}`, background: V.coralLt,
              color: V.coral, fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: V.sans,
            }}
          >
            🗑 すべてのデータを削除
          </button>
        </section>
      </div>
    </main>
  );
}
