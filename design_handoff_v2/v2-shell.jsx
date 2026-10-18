/* eslint-disable */
// v2 — 安心と成長 / Trust × Warmth Professional
// Shared tokens, header, sidebar, app shell.
// Palette and patterns lifted directly from the design brief.

window.V2 = {
  // Brief's palette, kept exact ───────────────────────────────────
  blue:       '#4A90E2',
  blueDeep:   '#2D6CB8',
  blueLite:   '#E3F2FD',     // AI message bubbles
  coral:      '#FF6B6B',     // CTA / 低スコア
  coralLite:  '#FFE3E3',
  green:      '#6BCB77',     // 高スコア / user surface accent
  greenLite:  '#E8F5E9',     // ユーザーメッセージ
  orange:     '#FFB347',     // 中スコア
  bg:         '#F8F9FA',
  surface:    '#FFFFFF',
  ink:        '#2D3436',
  ink2:       '#5b6066',
  ink3:       '#9aa0a6',
  border:     '#E5E7EB',
  borderSoft: '#EEF1F4',

  // Type stacks
  round: '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "M PLUS Rounded 1c", sans-serif',
  sans:  '"Noto Sans JP", "Hiragino Sans", system-ui, sans-serif',
};

const v2 = window.V2;

// ── shared bits ───────────────────────────────────────────────────
window.V2_BadgeDot = function V2_BadgeDot({ color = v2.coral, size = 8, pulse = false }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color, position: 'relative',
      animation: pulse ? 'v2pulse 1.4s ease-in-out infinite' : 'none',
    }} />
  );
};

// Header: logo · breadcrumb · streak · avatar
window.V2_Header = function V2_Header({ view }) {
  const titles = {
    chat:   ['練習する', 'AIクライアントと対話'],
    report: ['評価レポート', '練習 #12 ・ 2026.05.22'],
    history:['会話履歴', '過去の練習を見返す'],
    settings:['設定', ''],
  };
  const [main, sub] = titles[view] || titles.chat;
  return (
    <header style={{
      height: 64, padding: '0 28px',
      background: v2.surface,
      borderBottom: `1px solid ${v2.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gridArea: 'header',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: v2.blue,
          display: 'grid', placeItems: 'center',
          color: '#fff', fontFamily: v2.round, fontWeight: 700, fontSize: 18,
          boxShadow: `0 6px 14px -6px ${v2.blue}`,
        }}>聴</div>
        <div>
          <div style={{ fontFamily: v2.round, fontWeight: 700, fontSize: 15, color: v2.ink, lineHeight: 1 }}>
            AIコーチング練習
          </div>
          <div style={{ fontFamily: v2.sans, fontSize: 11, color: v2.ink3, marginTop: 3 }}>
            安心して、ことばを試せる場所。
          </div>
        </div>
        <div style={{
          width: 1, height: 28, background: v2.border, margin: '0 8px',
        }} />
        <div>
          <div style={{ fontFamily: v2.round, fontWeight: 600, fontSize: 14, color: v2.ink, lineHeight: 1 }}>
            {main}
          </div>
          {sub && (
            <div style={{ fontFamily: v2.sans, fontSize: 11, color: v2.ink3, marginTop: 3 }}>
              {sub}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* streak chip */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: v2.coralLite, color: v2.coral,
          padding: '6px 12px', borderRadius: 999,
          fontFamily: v2.round, fontWeight: 600, fontSize: 12,
        }}>
          <span style={{ fontSize: 14 }}>♥</span>
          <span>連続 12 日</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: `linear-gradient(135deg, ${v2.blue}, ${v2.blueDeep})`,
            color: '#fff', display: 'grid', placeItems: 'center',
            fontFamily: v2.round, fontWeight: 700, fontSize: 13,
          }}>K</div>
          <div>
            <div style={{ fontFamily: v2.round, fontWeight: 600, fontSize: 13, color: v2.ink, lineHeight: 1 }}>
              安田 圭祐
            </div>
            <div style={{ fontFamily: v2.sans, fontSize: 10, color: v2.ink3, marginTop: 2 }}>
              コーチ見習い ・ Lv.3
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Sidebar: nav + 会話開始 CTA
window.V2_Sidebar = function V2_Sidebar({ view, onNav }) {
  const items = [
    { id: 'chat',     icon: '💬', label: '練習する',   sub: 'AIと対話' },
    { id: 'history',  icon: '📜', label: '会話履歴',   sub: '12 セッション' },
    { id: 'report',   icon: '📊', label: 'レポート',   sub: '前回 +6 点' },
    { id: 'settings', icon: '⚙',  label: '設定',       sub: '' },
  ];
  return (
    <aside style={{
      background: v2.surface,
      borderRight: `1px solid ${v2.border}`,
      gridArea: 'sidebar',
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px 18px',
    }}>
      <div style={{
        fontFamily: v2.sans, fontSize: 10, fontWeight: 600,
        color: v2.ink3, letterSpacing: '0.18em', textTransform: 'uppercase',
        padding: '4px 10px 10px',
      }}>MENU</div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {items.map(it => {
          const active = it.id === view;
          return (
            <button
              key={it.id}
              onClick={() => onNav && onNav(it.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: active ? v2.blueLite : 'transparent',
                border: 'none', borderRadius: 12,
                padding: '12px 12px', cursor: 'pointer',
                textAlign: 'left', position: 'relative',
                fontFamily: v2.round,
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: active ? v2.blue : v2.bg,
                color: active ? '#fff' : v2.ink2,
                display: 'grid', placeItems: 'center',
                fontSize: 15, flexShrink: 0,
                transition: 'all 0.2s',
              }}>{it.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: v2.round, fontWeight: 600, fontSize: 13.5,
                  color: active ? v2.blue : v2.ink, lineHeight: 1.2,
                }}>{it.label}</div>
                {it.sub && (
                  <div style={{ fontFamily: v2.sans, fontSize: 10.5, color: v2.ink3, marginTop: 2 }}>
                    {it.sub}
                  </div>
                )}
              </div>
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: 12, bottom: 12, width: 3,
                  background: v2.blue, borderRadius: '0 3px 3px 0',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Inline mini growth */}
      <div style={{
        marginTop: 22, padding: 14,
        background: v2.bg, borderRadius: 14,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <div style={{ fontFamily: v2.round, fontWeight: 600, fontSize: 12, color: v2.ink }}>
            今週の成長
          </div>
          <div style={{ fontFamily: v2.round, fontWeight: 700, fontSize: 13, color: v2.green }}>
            +12%
          </div>
        </div>
        {/* mini sparkline */}
        <svg viewBox="0 0 120 36" width="100%" height="36" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="v2-spark-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={v2.blue} stopOpacity="0.25" />
              <stop offset="100%" stopColor={v2.blue} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0 28 L17 22 L34 25 L51 18 L68 14 L85 16 L102 9 L120 6 L120 36 L0 36 Z"
                fill="url(#v2-spark-fill)" />
          <path d="M0 28 L17 22 L34 25 L51 18 L68 14 L85 16 L102 9 L120 6"
                fill="none" stroke={v2.blue} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx="120" cy="6" r="2.5" fill={v2.coral} />
        </svg>
      </div>

      <div style={{ flex: 1 }} />

      {/* CTA: 会話開始 */}
      <button
        onClick={() => onNav && onNav('chat')}
        style={{
          background: v2.coral, color: '#fff',
          border: 'none', borderRadius: 14,
          padding: '14px 16px',
          fontFamily: v2.round, fontWeight: 700, fontSize: 14,
          cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: `0 10px 22px -10px ${v2.coral}`,
        }}>
        <div>
          <div>新しい練習を始める</div>
          <div style={{ fontFamily: v2.sans, fontSize: 10.5, fontWeight: 400, marginTop: 2, opacity: 0.92 }}>
            3 つのシナリオから
          </div>
        </div>
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          display: 'grid', placeItems: 'center', fontSize: 14,
        }}>→</span>
      </button>
    </aside>
  );
};

// Reusable small components ─────────────────────────────────────────
window.V2_Card = function V2_Card({ children, style = {}, hover = false }) {
  return (
    <div style={{
      background: v2.surface,
      border: `1px solid ${v2.border}`,
      borderRadius: 16,
      boxShadow: '0 1px 2px rgba(45,52,54,0.04)',
      ...style,
    }}>{children}</div>
  );
};

window.V2_SectionTitle = function V2_SectionTitle({ children, sub, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      marginBottom: 14,
    }}>
      <div>
        <div style={{
          fontFamily: v2.round, fontSize: 16, fontWeight: 700, color: v2.ink,
        }}>{children}</div>
        {sub && (
          <div style={{ fontFamily: v2.sans, fontSize: 12, color: v2.ink3, marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
      {action}
    </div>
  );
};

// One-time animation styles
if (typeof document !== 'undefined' && !document.getElementById('v2-anim')) {
  const s = document.createElement('style');
  s.id = 'v2-anim';
  s.textContent = `
    @keyframes v2pulse {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40%           { transform: scale(1);   opacity: 1;   }
    }
    @keyframes v2bob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }
    @keyframes v2fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .v2-typing-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      background: ${v2.blue}; opacity: 0.5;
      animation: v2pulse 1.4s ease-in-out infinite;
    }
    .v2-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .v2-typing-dot:nth-child(3) { animation-delay: 0.4s; }

    .v2-cursor::after {
      content: '|'; color: ${v2.blue};
      animation: v2blink 1s steps(2) infinite;
      margin-left: 2px; font-weight: 400;
    }
    @keyframes v2blink { 50% { opacity: 0; } }

    .v2-msg-enter { animation: v2fadeIn 0.35s ease-out both; }

    .v2-radial-stop {
      transition: stroke-dashoffset 1.2s cubic-bezier(.2,.7,.3,1);
    }
  `;
  document.head.appendChild(s);
}
