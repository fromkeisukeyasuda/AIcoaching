"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";

/**
 * 条件付き TopNav — セッション画面（没入体験）では上部ナビだけ非表示にする。
 * スマホの下部タブバーは、ほかのページと同じように常に表示する。
 */
export default function NavWrapper() {
  const path = usePathname();

  // /session は全画面体験なので、上部ナビは隠す（下部タブバーは残す）
  return <TopNav immersive={path === "/session"} />;
}
