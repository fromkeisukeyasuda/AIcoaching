"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const N = {
  navy:   "#1C2B4A",
  green:  "#4DB689",
  coral:  "#F07268",
};

const navItems = [
  { href: "/",        label: "ホーム",         exact: true  },
  { href: "/session", label: "練習",           exact: false },
  { href: "/history", label: "ふりかえり",     exact: false },
  { href: "/mypage",  label: "マイページ",     exact: false },
];

export default function TopNav() {
  const path = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? path === href : path.startsWith(href);
  }

  return (
    <nav
      style={{
        background: N.navy,
        height: 60,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 12px rgba(28,43,74,0.18)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginRight: 48,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: N.green,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            flexShrink: 0,
          }}
        >
          🎯
        </div>
        <span
          style={{
            color: "white",
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          AIコーチトレーナー
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 2, flex: 1 }}>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: active ? N.green : "rgba(255,255,255,0.65)",
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                textDecoration: "none",
                padding: "7px 14px",
                borderRadius: 8,
                background: active ? "rgba(77,182,137,0.12)" : "transparent",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Avatar / MyPage */}
      <Link href="/mypage" style={{ textDecoration: "none", flexShrink: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 18,
            transition: "background 0.15s",
          }}
        >
          👤
        </div>
      </Link>
    </nav>
  );
}
