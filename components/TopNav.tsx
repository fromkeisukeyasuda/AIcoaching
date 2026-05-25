"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── デザイントークン ── */
const C = {
  navy:   "#1C2B4A",
  green:  "#4DB689",
  ink2:   "#4A5568",
  ink3:   "#8A9BAB",
  border: "#E8ECF0",
};

/* ── SVG アイコン ── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? C.navy : C.ink3} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function ChatIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? C.navy : C.ink3} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? C.navy : C.ink3} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? C.navy : C.ink3} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

const NAV_ITEMS = [
  { href: "/",        label: "ホーム",     Icon: HomeIcon,  exact: true  },
  { href: "/session", label: "練習",       Icon: ChatIcon,  exact: false },
  { href: "/history", label: "ふりかえり", Icon: ChartIcon, exact: false },
  { href: "/mypage",  label: "マイページ", Icon: UserIcon,  exact: false },
];

export default function TopNav() {
  const path = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? path === href : path.startsWith(href);
  }

  return (
    <nav
      style={{
        background: "#FFFFFF",
        height: 64,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "stretch",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(26,35,50,0.06)",
        gap: 0,
      }}
    >
      {/* ロゴ */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginRight: 40,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `2px solid ${C.navy}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill={C.navy} />
            <path d="M8 12c0-2.21 1.79-4 4-4s4 1.79 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="15" r="1.5" fill="white" />
          </svg>
        </div>
        <span
          style={{
            color: C.navy,
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          AIコーチトレーナー
        </span>
      </Link>

      {/* ナビリンク */}
      <div style={{ display: "flex", alignItems: "stretch", gap: 0, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 16px",
                textDecoration: "none",
                color: active ? C.navy : C.ink3,
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                borderBottom: `3px solid ${active ? C.navy : "transparent"}`,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
                position: "relative",
                top: 1,
              }}
            >
              <item.Icon active={active} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ユーザーアバター */}
      <Link
        href="/mypage"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#EBF8F3",
            border: `2px solid ${C.green}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            overflow: "hidden",
          }}
        >
          👩
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink3} strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </Link>
    </nav>
  );
}
