"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/* ── デザイントークン ── */
const C = {
  navy:   "#F5F1FF",   // アクティブな文字・アイコン
  accent: "#F472B6",   // アクセント（ピンク）
  green:  "#5FD3A0",
  ink2:   "#CFC9E4",
  ink3:   "#8F8AA8",
  border: "rgba(255,255,255,0.10)",
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
function QuizIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={active ? C.navy : C.ink3} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
const NAV_ITEMS: { href: string; label: string; shortLabel?: string; Icon: (p: { active: boolean }) => React.JSX.Element; exact: boolean }[] = [
  { href: "/",         label: "ホーム",     Icon: HomeIcon,     exact: true  },
  { href: "/session",  label: "練習",       Icon: ChatIcon,     exact: false },
  { href: "/talk",     label: "相談",       Icon: ChatIcon,     exact: false },
  { href: "/quiz",     label: "クイズ",     Icon: QuizIcon,     exact: false },
  { href: "/history",  label: "ふりかえり", Icon: ChartIcon,    exact: false },
  { href: "/mypage",   label: "マイページ", Icon: UserIcon,     exact: false },
];

export default function TopNav() {
  const path = usePathname();

  function isActive(href: string, exact: boolean) {
    return exact ? path === href : path.startsWith(href);
  }

  return (
    <>
    <nav
      className="topnav"
      style={{
        background: "#14121f",
        height: 64,
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "stretch",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        gap: 0,
      }}
    >
      {/* ロゴ */}
      <Link
        href="/"
        className="topnav-logo"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          marginRight: 40,
          flexShrink: 0,
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, whiteSpace: "nowrap" }}>
          <span style={{ color: C.navy, fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>
            RoleMate
          </span>
          <span style={{ color: C.ink3, fontWeight: 500, fontSize: 9.5, letterSpacing: "0.08em", marginTop: 3 }}>
            AI Roleplay Partner
          </span>
        </span>
      </Link>

      {/* ナビリンク（PC・タブレット。スマホでは下部タブバーに切り替え） */}
      <div className="topnav-links" style={{ display: "flex", alignItems: "stretch", gap: 0, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`topnav-link${active ? " is-active" : ""}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 16px",
                textDecoration: "none",
                color: active ? C.navy : C.ink3,
                fontWeight: active ? 700 : 400,
                fontSize: 14,
                borderBottom: `3px solid ${active ? C.accent : "transparent"}`,
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

    </nav>

    {/* スマホ用 下部タブバー（CSSで768px以下のときだけ表示） */}
    <nav className="bottom-tabs" aria-label="メインメニュー">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <item.Icon active={active} />
            <span>{item.shortLabel ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
    </>
  );
}
