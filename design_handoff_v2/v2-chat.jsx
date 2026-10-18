/* eslint-disable */
// v2 — Chat view (rev2)
// Left half: AI character portrait + meta
// Right half: chat messages + レベルアップポイント + composer

const v2c = window.V2;

// ─── SVG character (warm/light palette, idle blink + speak mouth) ───
function V2_Character({ speaking }) {
  // Returns a stylized 田中誠-style portrait, designed to fit ~360–420px.
  return (
    <svg viewBox="0 0 320 380" width="100%" height="100%"
         style={{ display: 'block', maxHeight: '100%' }}
         preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="v2-char-halo" cx="50%" cy="48%" r="55%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="60%" stopColor="#E3F2FD" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#E3F2FD" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="v2-char-jacket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a4a72" />
          <stop offset="100%" stopColor="#1f2e4a" />
        </linearGradient>
        <linearGradient id="v2-char-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2e26" />
          <stop offset="100%" stopColor="#221a14" />
        </linearGradient>
      </defs>

      {/* Halo */}
      <circle cx="160" cy="180" r="160" fill="url(#v2-char-halo)" />

      {/* Body / jacket */}
      <path
        d="M40,380 Q60,300 110,290 L130,308 L160,322 L190,308 L210,290 Q260,300 280,380 Z"
        fill="url(#v2-char-jacket)"
      />
      {/* shirt v */}
      <path d="M130,308 L160,360 L190,308 L160,322 Z" fill="#f7f4ee" />
      {/* tie */}
      <path d="M156,322 L150,355 L160,375 L170,355 L164,322 Z" fill={v2c.coral} />
      <path d="M155,322 L165,322 L162,332 L158,332 Z" fill={v2c.coralLite} />

      {/* Neck */}
      <rect x="146" y="248" width="28" height="48" rx="6" fill="#f5d3b8" />

      {/* Head shape */}
      <ellipse cx="160" cy="180" rx="78" ry="84" fill="#f8dcc0" />

      {/* Hair (top + sides) */}
      <path
        d="M82,170 Q88,108 160,98 Q232,108 238,170 Q220,128 160,122 Q100,128 82,170 Z"
        fill="url(#v2-char-hair)"
      />
      {/* hair bangs */}
      <path d="M108,134 Q150,118 192,134 Q178,142 160,142 Q142,142 108,134 Z"
            fill="url(#v2-char-hair)" />

      {/* Cheeks (soft blush) */}
      <ellipse cx="118" cy="206" rx="14" ry="8" fill="#f5b89c" opacity="0.35" />
      <ellipse cx="202" cy="206" rx="14" ry="8" fill="#f5b89c" opacity="0.35" />

      {/* Eyebrows */}
      <path d="M104,156 Q120,148 138,156" stroke="#2a1f15" strokeWidth="3.5"
            fill="none" strokeLinecap="round" />
      <path d="M182,156 Q200,148 216,156" stroke="#2a1f15" strokeWidth="3.5"
            fill="none" strokeLinecap="round" />

      {/* Eyes — blink animations via existing keyframes injected in v2-shell */}
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center',
                  animation: 'eyeBlink 4.5s ease-in-out infinite' }}>
        <ellipse cx="124" cy="180" rx="11" ry="10" fill="#fff" />
        <ellipse cx="124" cy="181" rx="7" ry="7" fill="#1f2e4a" />
        <ellipse cx="121" cy="178" rx="2.5" ry="2" fill="#fff" opacity="0.85" />
      </g>
      <g style={{ transformBox: 'fill-box', transformOrigin: 'center',
                  animation: 'eyeBlink 4.5s ease-in-out 0.08s infinite' }}>
        <ellipse cx="196" cy="180" rx="11" ry="10" fill="#fff" />
        <ellipse cx="196" cy="181" rx="7" ry="7" fill="#1f2e4a" />
        <ellipse cx="193" cy="178" rx="2.5" ry="2" fill="#fff" opacity="0.85" />
      </g>

      {/* Nose */}
      <path d="M158,196 Q156,216 152,224 Q156,228 164,228 Q172,228 168,224 Q164,216 162,196 Z"
            fill="#e9c19f" opacity="0.7" />

      {/* Mouth — bobs while speaking */}
      {speaking ? (
        <ellipse cx="160" cy="242" rx="13" ry="9" fill="#5a1a1a"
                 style={{ transformBox: 'fill-box', transformOrigin: 'center',
                          animation: 'speakMouth 0.35s ease-in-out infinite alternate' }} />
      ) : (
        <path d="M146,240 Q160,250 174,240" stroke="#5a1a1a" strokeWidth="3"
              fill="none" strokeLinecap="round" />
      )}

      {/* Ears */}
      <ellipse cx="82" cy="186" rx="8" ry="14" fill="#f5d3b8" />
      <ellipse cx="238" cy="186" rx="8" ry="14" fill="#f5d3b8" />
    </svg>
  );
}

// Single CSS keyframe used by the chat — character bob + halo breath.
if (typeof document !== 'undefined' && !document.getElementById('v2-chat-anim')) {
  const s = document.createElement('style');
  s.id = 'v2-chat-anim';
  s.textContent = `
    @keyframes v2charFloat {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes v2charBob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }
    @keyframes eyeBlink {
      0%, 82%, 100% { transform: scaleY(1); }
      86%           { transform: scaleY(0.08); }
      89%           { transform: scaleY(0.9); }
      93%           { transform: scaleY(0.08); }
      96%           { transform: scaleY(1); }
    }
    @keyframes speakMouth {
      0%   { transform: scaleY(0.45); }
      100% { transform: scaleY(1); }
    }
    @keyframes v2haloBreath {
      0%, 100% { transform: scale(1);    opacity: 0.55; }
      50%      { transform: scale(1.06); opacity: 0.8;  }
    }
    @keyframes v2ringPing {
      0%   { transform: scale(0.92); opacity: 0.55; }
      80%, 100% { transform: scale(1.18); opacity: 0; }
    }
  `;
  document.head.appendChild(s);
}

// ───────────────────────────────────────────────────────────────────
window.V2_ChatView = function V2_ChatView() {
  const scenario = window.AIC_DATA.scenarios[0]; // 田中 — team-management
  const seed = window.AIC_DATA.sessionMessages;

  // Streaming demo state
  const [shown, setShown] = React.useState(() =>
    seed.slice(0, 2).map(m => ({ ...m, full: m.content, typing: false }))
  );
  const [aiTyping, setAiTyping] = React.useState(false);

  React.useEffect(() => {
    let t1, t2, t3;
    t1 = setTimeout(() => {
      const msg = seed[2];
      if (!msg) return;
      setShown(s => [...s, { ...msg, full: msg.content, typing: false }]);
      t2 = setTimeout(() => {
        setAiTyping(true);
        t3 = setTimeout(() => {
          setAiTyping(false);
          const next = seed[3];
          setShown(s => [...s, { ...next, full: next.content, content: '', typing: true }]);
        }, 1600);
      }, 700);
    }, 1100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line
  }, []);

  React.useEffect(() => {
    const idx = shown.findIndex(m => m.typing);
    if (idx === -1) return;
    const target = shown[idx];
    if (target.content.length >= target.full.length) {
      setShown(s => s.map((m, i) => i === idx ? { ...m, typing: false } : m));
      return;
    }
    const timer = setTimeout(() => {
      setShown(s => s.map((m, i) => {
        if (i !== idx) return m;
        return { ...m, content: m.full.slice(0, m.content.length + 1) };
      }));
    }, 38);
    return () => clearTimeout(timer);
  }, [shown]);

  const restart = () => {
    setShown(seed.slice(0, 2).map(m => ({ ...m, full: m.content, typing: false })));
    setAiTyping(false);
  };

  // 田中 is "speaking" when streaming OR typing dots are showing.
  const speaking = aiTyping || shown.some(m => m.typing);

  return (
    <div style={{
      gridArea: 'main', padding: '20px 24px 24px', background: v2c.bg,
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 18, minHeight: 0, overflow: 'hidden',
    }}>
      {/* ─── LEFT: AI character panel ─── */}
      <V2_CharacterPanel scenario={scenario} speaking={speaking} />

      {/* ─── RIGHT: chat panel ─── */}
      <V2_ChatPanel
        scenario={scenario}
        shown={shown}
        aiTyping={aiTyping}
        speaking={speaking}
        onRestart={restart}
      />
    </div>
  );
};

// ─── LEFT PANEL ────────────────────────────────────────────────────
window.V2_CharacterPanel = function V2_CharacterPanel({ scenario, speaking }) {
  return (
    <V2_Card style={{
      padding: 0, overflow: 'hidden',
      display: 'grid', gridTemplateRows: 'auto 1fr auto',
      gridTemplateColumns: 'minmax(0, 1fr)',
      minHeight: 0,
    }}>
      {/* Slim scenario strip */}
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${v2c.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: v2c.blueLite, color: v2c.blue,
            fontFamily: v2c.round, fontWeight: 700, fontSize: 11,
            padding: '3px 10px', borderRadius: 999,
          }}>今日のシナリオ</span>
          <span style={{ fontFamily: v2c.round, fontWeight: 700, fontSize: 14, color: v2c.ink }}>
            {scenario.title}
          </span>
          <span style={{ fontFamily: v2c.sans, fontSize: 11, color: v2c.ink3 }}>
            第 12 回 ・ 経過 14:32
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: v2c.sans, fontSize: 11, color: v2c.ink3,
        }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: v2c.greenLite, color: '#2d7a36',
            padding: '4px 10px', borderRadius: 999,
            fontFamily: v2c.round, fontWeight: 700, fontSize: 11,
          }}>
            <span>🔒</span> 安全な練習空間
          </span>
        </div>
      </div>

      {/* Character stage */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(180deg, #fff 0%, ${v2c.bg} 100%)`,
        display: 'grid', placeItems: 'center', minHeight: 0,
      }}>
        {/* breathing halo */}
        <div style={{
          position: 'absolute', width: '70%', aspectRatio: '1',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${v2c.blueLite} 0%, transparent 70%)`,
          animation: 'v2haloBreath 4s ease-in-out infinite',
        }} />
        {speaking && (
          <>
            <div style={{
              position: 'absolute', width: '52%', aspectRatio: '1', borderRadius: '50%',
              border: `2px solid ${v2c.blue}`, opacity: 0.3,
              animation: 'v2ringPing 2s cubic-bezier(0,0,0.2,1) infinite',
            }} />
            <div style={{
              position: 'absolute', width: '52%', aspectRatio: '1', borderRadius: '50%',
              border: `2px solid ${v2c.blue}`, opacity: 0.3,
              animation: 'v2ringPing 2s cubic-bezier(0,0,0.2,1) 0.5s infinite',
            }} />
          </>
        )}
        <div style={{
          position: 'relative', width: '78%', height: '85%',
          display: 'grid', placeItems: 'center',
          animation: speaking ? 'v2charBob 1.5s ease-in-out infinite' : 'v2charFloat 4s ease-in-out infinite',
        }}>
          <V2_Character speaking={speaking} />
        </div>

        {/* status pill (bottom center) */}
        <div style={{
          position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
          background: v2c.surface, border: `1px solid ${v2c.border}`,
          borderRadius: 999, padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: v2c.round, fontWeight: 600, fontSize: 12, color: v2c.ink2,
          boxShadow: '0 8px 20px -12px rgba(45,52,54,0.15)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: speaking ? v2c.coral : v2c.green,
            animation: speaking ? 'v2pulse 1.4s ease-in-out infinite' : 'none',
          }} />
          {speaking ? '田中さんが話しています…' : '田中さん ・ あなたの言葉を待っています'}
        </div>
      </div>

      {/* Bottom info block */}
      <div style={{
        padding: '18px 22px 20px', borderTop: `1px solid ${v2c.borderSoft}`,
        background: v2c.surface,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: `linear-gradient(135deg, ${v2c.blue}, ${v2c.blueDeep})`,
            color: '#fff', fontFamily: v2c.round, fontWeight: 700, fontSize: 18,
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>田</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: v2c.round, fontWeight: 700, fontSize: 17, color: v2c.ink }}>
              {scenario.clientName}<span style={{ fontFamily: v2c.sans, fontWeight: 500, fontSize: 12, color: v2c.ink3, marginLeft: 8 }}>{scenario.clientRole}</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              {scenario.tags.slice(0, 3).map(t => (
                <span key={t} style={{
                  fontFamily: v2c.sans, fontSize: 10.5,
                  padding: '2px 8px', borderRadius: 6,
                  background: v2c.bg, color: v2c.ink2,
                }}># {t}</span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          <div style={{
            background: v2c.bg, borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{
              fontFamily: v2c.round, fontWeight: 700, fontSize: 11, color: v2c.blue,
              marginBottom: 6, letterSpacing: '0.05em',
            }}>状況</div>
            <p style={{
              fontFamily: v2c.sans, fontSize: 12, color: v2c.ink2, lineHeight: 1.75, margin: 0,
            }}>{scenario.situation}</p>
          </div>
          <div style={{
            background: v2c.bg, borderRadius: 10, padding: '12px 14px',
          }}>
            <div style={{
              fontFamily: v2c.round, fontWeight: 700, fontSize: 11, color: v2c.coral,
              marginBottom: 6, letterSpacing: '0.05em',
            }}>こころもち</div>
            <p style={{
              fontFamily: v2c.sans, fontSize: 12, color: v2c.ink2, lineHeight: 1.75, margin: 0,
            }}>{scenario.emotion}</p>
          </div>
        </div>
      </div>
    </V2_Card>
  );
};

// ─── RIGHT PANEL ───────────────────────────────────────────────────
window.V2_ChatPanel = function V2_ChatPanel({ scenario, shown, aiTyping, speaking, onRestart }) {
  return (
    <V2_Card style={{
      padding: 0, overflow: 'hidden',
      display: 'grid', gridTemplateRows: 'auto 1fr auto auto',
      gridTemplateColumns: 'minmax(0, 1fr)',
      minHeight: 0,
    }}>
      {/* Chat header */}
      <div style={{
        padding: '14px 22px', borderBottom: `1px solid ${v2c.borderSoft}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: v2c.round, fontWeight: 700, fontSize: 14, color: v2c.ink,
          }}>
            対話
            <span style={{ fontFamily: v2c.sans, fontWeight: 500, fontSize: 11, color: v2c.ink3, marginLeft: 8 }}>
              発話 {shown.length} ／ 田中さんと
            </span>
          </div>
          <div style={{ fontFamily: v2c.sans, fontSize: 11, color: v2c.ink3, marginTop: 3 }}>
            前回 78 点  ・  ↑ +7  ・  10 分目標
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onRestart} style={{
            background: v2c.bg, color: v2c.ink2,
            border: `1px solid ${v2c.border}`,
            borderRadius: 8, padding: '6px 10px',
            fontFamily: v2c.sans, fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>↻ 再生</button>
          <button style={{
            background: v2c.coral, color: '#fff',
            border: 'none', borderRadius: 8, padding: '6px 14px',
            fontFamily: v2c.round, fontWeight: 600, fontSize: 12, cursor: 'pointer',
          }}>セッション終了</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        padding: '18px 22px', overflow: 'auto',
        display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0,
      }}>
        {shown.map((m, i) => <V2_Message key={i} m={m} scenario={scenario} />)}
        {aiTyping && (
          <div className="v2-msg-enter" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `linear-gradient(135deg, ${v2c.blue}, ${v2c.blueDeep})`,
              color: '#fff', fontFamily: v2c.round, fontWeight: 700, fontSize: 12,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>田</div>
            <div style={{
              background: v2c.blueLite,
              padding: '14px 18px', borderRadius: '16px 16px 16px 4px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span className="v2-typing-dot" />
              <span className="v2-typing-dot" />
              <span className="v2-typing-dot" />
              <span style={{ fontFamily: v2c.sans, fontSize: 12, color: v2c.ink3, marginLeft: 6 }}>
                考え中…
              </span>
            </div>
          </div>
        )}
      </div>

      {/* レベルアップポイント — above the composer */}
      <V2_LevelUpPoints />

      {/* Composer */}
      <V2_Composer />
    </V2_Card>
  );
};

// ─── レベルアップポイント (formerly: prompt suggestions) ───────────
window.V2_LevelUpPoints = function V2_LevelUpPoints() {
  const items = [
    {
      i: '✨', t: 'オープンクエスチョン',     d: '「何が／どのように」で聞く',
      hint: '田中さんに「何が一番気がかりですか？」と聞いてみましょう',
      c: v2c.blue,
    },
    {
      i: '💡', t: '感情をラベリング',         d: '相手の気持ちを言葉にする',
      hint: '「焦りを感じているんですね」と返してみましょう',
      c: v2c.orange,
    },
    {
      i: '🎯', t: '私メッセージで返す',       d: '「私は〜」で意見を伝える',
      hint: '「私は、その状況なら〇〇と感じます」',
      c: v2c.coral,
    },
  ];

  return (
    <div style={{
      padding: '12px 22px 0', borderTop: `1px dashed ${v2c.border}`,
      background: v2c.surface,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            background: `linear-gradient(135deg, ${v2c.blue}, ${v2c.blueDeep})`,
            color: '#fff', fontFamily: v2c.round, fontWeight: 700, fontSize: 11,
            padding: '3px 10px', borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ fontSize: 12 }}>⚡</span> レベルアップポイント
          </span>
          <span style={{ fontFamily: v2c.sans, fontSize: 11, color: v2c.ink3 }}>
            今回のセッションで意識すると伸びる 3 つ
          </span>
        </div>
        <span style={{ fontFamily: v2c.sans, fontSize: 11, color: v2c.ink3 }}>
          クリックで入力欄に挿入 →
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {items.map(p => (
          <button key={p.t} style={{
            background: v2c.surface, border: `1px solid ${v2c.border}`,
            borderRadius: 12, padding: '10px 12px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer', textAlign: 'left',
            transition: 'all 0.15s', position: 'relative',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${p.c}1A`, color: p.c,
              display: 'grid', placeItems: 'center', fontSize: 14,
              flexShrink: 0,
            }}>{p.i}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{
                  fontFamily: v2c.round, fontWeight: 700, fontSize: 12, color: v2c.ink,
                }}>{p.t}</div>
                <div style={{
                  fontFamily: v2c.round, fontWeight: 700, fontSize: 9,
                  color: p.c, background: `${p.c}1A`,
                  padding: '1px 6px', borderRadius: 4,
                }}>+5pt</div>
              </div>
              <div style={{
                fontFamily: v2c.sans, fontSize: 10.5, color: v2c.ink3,
                marginTop: 2, lineHeight: 1.5,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{p.hint}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Message bubble ────────────────────────────────────────────────
window.V2_Message = function V2_Message({ m, scenario }) {
  const isUser = m.role === 'user';
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);

  return (
    <div className="v2-msg-enter" style={{
      display: 'flex', gap: 10, alignItems: 'flex-end',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }}>
      {!isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `linear-gradient(135deg, ${v2c.blue}, ${v2c.blueDeep})`,
          color: '#fff', fontFamily: v2c.round, fontWeight: 700, fontSize: 12,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>田</div>
      )}
      <div style={{
        maxWidth: '78%',
        display: 'flex', flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
      }}>
        <div style={{
          background: isUser ? v2c.greenLite : v2c.blueLite,
          color: v2c.ink,
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          fontFamily: v2c.sans, fontSize: 14, lineHeight: 1.75,
        }}>
          <span className={m.typing ? 'v2-cursor' : ''}>{m.content}</span>
        </div>
        {!isUser && !m.typing && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, paddingLeft: 4,
          }}>
            <button style={smallIconBtn(v2c)}>👍</button>
            <button onClick={() => setFeedbackOpen(o => !o)} style={smallIconBtn(v2c)}>👎</button>
            <button style={smallIconBtn(v2c)}>↻</button>
            <button style={smallIconBtn(v2c)}>✏</button>
            {feedbackOpen && (
              <div style={{ display: 'flex', gap: 4, marginLeft: 6 }}>
                {['不正確', '関係ない', '不完全', '有害'].map(t => (
                  <button key={t} style={{
                    fontFamily: v2c.sans, fontSize: 10.5, fontWeight: 600,
                    color: v2c.ink2, background: v2c.bg,
                    border: `1px solid ${v2c.border}`,
                    padding: '3px 8px', borderRadius: 6, cursor: 'pointer',
                  }}>{t}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: `linear-gradient(135deg, ${v2c.green}, #4a8e54)`,
          color: '#fff', fontFamily: v2c.round, fontWeight: 700, fontSize: 12,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>K</div>
      )}
    </div>
  );
};

function smallIconBtn(v2c) {
  return {
    width: 24, height: 24, borderRadius: 6,
    background: 'transparent', border: 'none',
    color: v2c.ink3, fontSize: 12, cursor: 'pointer',
    display: 'grid', placeItems: 'center',
  };
}

// ─── Composer ──────────────────────────────────────────────────────
window.V2_Composer = function V2_Composer() {
  const [val, setVal] = React.useState('');
  return (
    <div style={{
      borderTop: `1px solid ${v2c.borderSoft}`,
      padding: '12px 22px 14px',
      background: v2c.surface,
    }}>
      <div style={{
        background: v2c.bg, borderRadius: 14,
        border: `1px solid ${v2c.border}`,
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="ここに書く、または下のマイクで話しかける…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: v2c.sans, fontSize: 14, color: v2c.ink,
          }}
        />
        <span style={{ fontFamily: v2c.sans, fontSize: 11, color: v2c.ink3 }}>
          Enter で送信
        </span>
        <button style={{
          width: 36, height: 36, borderRadius: '50%',
          background: v2c.surface, border: `1px solid ${v2c.border}`,
          color: v2c.coral, cursor: 'pointer', fontSize: 15,
          display: 'grid', placeItems: 'center',
        }}>🎤</button>
        <button style={{
          background: v2c.blue, color: '#fff',
          border: 'none', borderRadius: 10,
          padding: '0 16px', height: 36,
          fontFamily: v2c.round, fontWeight: 700, fontSize: 13, cursor: 'pointer',
        }}>送信 ↑</button>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 6, paddingLeft: 2,
      }}>
        <div style={{ display: 'flex', gap: 14, fontFamily: v2c.sans, fontSize: 10.5, color: v2c.ink3 }}>
          <span>⌘ + Enter ／ 改行</span>
          <span>↑ ／ 一つ前の発話</span>
        </div>
        <div style={{ fontFamily: v2c.sans, fontSize: 10.5, color: v2c.ink3 }}>
          {val.length} / 800
        </div>
      </div>
    </div>
  );
};
