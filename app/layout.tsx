import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIコーチング練習",
  description: "AIと対話しながらコーチングスキルを磨くアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
