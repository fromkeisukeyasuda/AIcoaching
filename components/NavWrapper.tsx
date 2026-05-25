"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";

/**
 * 条件付き TopNav — セッション画面（没入体験）では非表示にする
 */
export default function NavWrapper() {
  const path = usePathname();

  // /session は全画面体験なのでナビを隠す
  if (path === "/session") return null;

  return <TopNav />;
}
