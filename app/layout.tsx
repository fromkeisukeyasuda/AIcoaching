import type { Metadata } from "next";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";

export const metadata: Metadata = {
  title: "AIコーチトレーナー",
  description: "AIと対話しながらコーチングスキルを磨くトレーニングアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <NavWrapper />
        {children}
      </body>
    </html>
  );
}
