import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "沈黙の問い | Vision Retreat Coaching",
  description: "誰にも言えなかったことに、名前をつける。経営者向け無料診断。",
};

export default function DiagnoseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
