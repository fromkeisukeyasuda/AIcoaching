"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="fit-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 24 }}>
      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 18, fontWeight: 700 }}>問題が発生しました</p>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>もう一度お試しください。続く場合は、ページを読み込み直してください。</p>
      <button onClick={reset} className="btn-primary">再試行</button>
    </div>
  );
}
