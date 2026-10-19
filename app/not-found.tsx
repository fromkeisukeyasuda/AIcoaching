import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fit-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, textAlign: "center", padding: 24 }}>
      <p className="text-grad" style={{ fontSize: 56, fontWeight: 800 }}>404</p>
      <p style={{ color: "rgba(255,255,255,0.75)" }}>ページが見つかりませんでした</p>
      <Link href="/" className="btn-primary">ホームへ戻る</Link>
    </div>
  );
}
