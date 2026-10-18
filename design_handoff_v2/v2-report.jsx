/* eslint-disable */
// v2 — Report view
// Overall score with count-up · 6-axis radar (self vs AI) · tiered feedback
// · growth trend over last 10 sessions

const v2r = window.V2;

// ── 6-axis competencies ────────────────────────────────────────────
const V2_AXES = [
  { key: 'listen',   label: '傾聴',     short: 'Listen',  ai: 17, self: 16, max: 20 },
  { key: 'empathy',  label: '共感',     short: 'Empathy', ai: 18, self: 19, max: 20 },
  { key: 'question', label: '質問力',   short: 'Inquiry', ai: 14, self: 17, max: 20 },
  { key: 'words',    label: '言語整理', short: 'Clarity', ai: 16, self: 15, max: 20 },
  { key: 'assert',   label: '主張力',   short: 'Assert',  ai: 13, self: 14, max: 20 },
  { key: 'presence', label: 'Presence', short: 'Presence',ai: 16, self: 18, max: 20 },
];

const V2_HISTORY = [42, 51, 49, 58, 62, 64, 71, 75, 76, 82]; // 10 sessions

// ── Animated count-up number ───────────────────────────────────────
window.V2_CountUp = function V2_CountUp({ to = 82, ms = 900, style, suffix }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return <span style={style}>{n}{suffix}</span>;
};

// ── Radar chart (6 axes, self vs AI overlay) ───────────────────────
window.V2_Radar = function V2_Radar({ size = 360 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.36;
  const n = V2_AXES.length;
  const angle = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i, value, max) => {
    const a = angle(i);
    const rad = (value / max) * r;
    return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad];
  };
  const polygon = (values) =>
    values.map((v, i) => point(i, v, V2_AXES[i].max).join(',')).join(' ');

  const grid = [0.25, 0.5, 0.75, 1].map(g => (
    <polygon key={g}
      points={V2_AXES.map((_, i) => {
        const a = angle(i);
        return [cx + Math.cos(a) * r * g, cy + Math.sin(a) * r * g].join(',');
      }).join(' ')}
      fill="none" stroke={v2r.border} strokeWidth="1" />
  ));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {/* axes */}
      {V2_AXES.map((_, i) => {
        const [x, y] = point(i, 1, 1);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={v2r.border} strokeWidth="1" />;
      })}
      {grid}

      {/* AI polygon */}
      <polygon
        points={polygon(V2_AXES.map(a => a.ai))}
        fill={v2r.blue} fillOpacity="0.22"
        stroke={v2r.blue} strokeWidth="2" strokeLinejoin="round"
      />
      {/* Self polygon */}
      <polygon
        points={polygon(V2_AXES.map(a => a.self))}
        fill={v2r.coral} fillOpacity="0.15"
        stroke={v2r.coral} strokeWidth="1.8" strokeDasharray="4 3" strokeLinejoin="round"
      />

      {/* AI dots */}
      {V2_AXES.map((a, i) => {
        const [x, y] = point(i, a.ai, a.max);
        return <circle key={'ai' + i} cx={x} cy={y} r={4} fill={v2r.blue} stroke="#fff" strokeWidth="1.5" />;
      })}
      {/* self dots */}
      {V2_AXES.map((a, i) => {
        const [x, y] = point(i, a.self, a.max);
        return <circle key={'s' + i} cx={x} cy={y} r={3.5} fill={v2r.coral} stroke="#fff" strokeWidth="1.5" />;
      })}

      {/* labels */}
      {V2_AXES.map((a, i) => {
        const [lx, ly] = point(i, 1.18, 1);
        const align = Math.abs(Math.cos(angle(i))) < 0.2
          ? 'middle' : Math.cos(angle(i)) > 0 ? 'start' : 'end';
        return (
          <g key={'lbl' + i} transform={`translate(${lx}, ${ly})`}>
            <text
              x="0" y="0"
              textAnchor={align}
              fontFamily={v2r.round}
              fontSize="13"
              fontWeight="700"
              fill={v2r.ink}
              dominantBaseline="middle"
            >{a.label}</text>
            <text
              x="0" y="14"
              textAnchor={align}
              fontFamily={v2r.sans}
              fontSize="10"
              fill={v2r.ink3}
              dominantBaseline="middle"
            >{a.ai}/{a.self}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Growth line chart ──────────────────────────────────────────────
window.V2_GrowthChart = function V2_GrowthChart({ width = 560, height = 180 }) {
  const padL = 28, padR = 24, padT = 18, padB = 26;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const max = 100, min = 0;
  const n = V2_HISTORY.length;
  const x = (i) => padL + (i / (n - 1)) * innerW;
  const y = (v) => padT + (1 - (v - min) / (max - min)) * innerH;
  const points = V2_HISTORY.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${y(0)} ${points} ${x(n - 1)},${y(0)}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ maxWidth: width, display: 'block' }}>
      <defs>
        <linearGradient id="v2-growth-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={v2r.blue} stopOpacity="0.18" />
          <stop offset="100%" stopColor={v2r.blue} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* y gridlines */}
      {[0, 25, 50, 75, 100].map(g => (
        <g key={g}>
          <line x1={padL} y1={y(g)} x2={width - padR} y2={y(g)} stroke={v2r.borderSoft} strokeWidth="1" />
          <text x={padL - 6} y={y(g) + 3} textAnchor="end" fontSize="10"
                fontFamily={v2r.sans} fill={v2r.ink3}>{g}</text>
        </g>
      ))}

      {/* x labels */}
      {V2_HISTORY.map((_, i) => (
        <text key={i} x={x(i)} y={height - 6} textAnchor="middle"
          fontFamily={v2r.sans} fontSize="10" fill={v2r.ink3}>
          {i + 1}
        </text>
      ))}

      {/* area + line */}
      <polygon points={area} fill="url(#v2-growth-fill)" />
      <polyline points={points} fill="none" stroke={v2r.blue} strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* dots */}
      {V2_HISTORY.map((v, i) => {
        const isLast = i === n - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={isLast ? 6 : 3.5}
              fill={isLast ? v2r.coral : v2r.surface}
              stroke={isLast ? '#fff' : v2r.blue}
              strokeWidth={isLast ? 3 : 2}
            />
            {isLast && (
              <g>
                <rect x={x(i) - 26} y={y(v) - 32} width="52" height="22" rx="6"
                      fill={v2r.ink} />
                <text x={x(i)} y={y(v) - 17} textAnchor="middle"
                      fontFamily={v2r.round} fontSize="12" fontWeight="700" fill="#fff">
                  {v} 点
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* +6 ribbon */}
      <g transform={`translate(${width - padR - 12}, ${padT + 2})`}>
        <text textAnchor="end" fontFamily={v2r.round}
              fontSize="10" fontWeight="700" fill={v2r.green}>↑ 前回比 +6</text>
      </g>
    </svg>
  );
};

// ── Mini score gauge (used in left column) ─────────────────────────
window.V2_RadialGauge = function V2_RadialGauge({ value = 82, size = 168 }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * (value / 100);
  const color = value >= 80 ? v2r.green : value >= 50 ? v2r.orange : v2r.coral;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <linearGradient id="v2-gauge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={v2r.blue} />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r}
        fill="none" stroke={v2r.bg} strokeWidth={stroke} />
      <circle
        className="v2-radial-stop"
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke="url(#v2-gauge)" strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeDashoffset={c * 0.25}
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
    </svg>
  );
};

// ── Report view (main) ─────────────────────────────────────────────
window.V2_ReportView = function V2_ReportView() {
  const e = window.AIC_DATA.evaluation;
  const [expanded, setExpanded] = React.useState('next');

  return (
    <div style={{
      gridArea: 'main', padding: '24px 32px 32px', background: v2r.bg,
      overflow: 'auto', minHeight: 0,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18,
        marginBottom: 18,
      }}>
        {/* Left: overall score */}
        <V2_Card style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: v2r.round, fontWeight: 700, fontSize: 13, color: v2r.ink }}>
              総合スコア
            </div>
            <div style={{ fontFamily: v2r.sans, fontSize: 11, color: v2r.ink3 }}>練習 #12</div>
          </div>

          <div style={{
            position: 'relative', margin: '14px auto 14px', width: 168, height: 168,
          }}>
            <V2_RadialGauge value={82} />
            <div style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center',
            }}>
              <div>
                <V2_CountUp to={82} style={{
                  fontFamily: v2r.round, fontSize: 56, fontWeight: 700, color: v2r.ink, lineHeight: 1,
                }} />
                <div style={{ fontFamily: v2r.round, fontSize: 11, color: v2r.ink3, marginTop: 6, fontWeight: 600 }}>
                  / 100 点
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
            {[1,1,1,1,1,1,1,1,0,0].map((v, i) => (
              <span key={i} style={{
                width: 9, height: 9, borderRadius: '50%',
                background: v ? v2r.blue : v2r.border,
              }} />
            ))}
          </div>

          {/* Delta + meta */}
          <div style={{
            background: v2r.greenLite, borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <div style={{ fontFamily: v2r.sans, fontSize: 12, color: '#2d7a36' }}>
              前回より <b style={{ fontFamily: v2r.round, fontSize: 14 }}>+6 点</b>
            </div>
            <div style={{ fontFamily: v2r.sans, fontSize: 11, color: '#3a8542' }}>
              ↑ 連続 4 回上昇中
            </div>
          </div>

          {/* meta rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: v2r.sans, fontSize: 12 }}>
            {[
              ['練習日',       '2026.05.22 ・ 金'],
              ['シナリオ',     'チームマネジメント'],
              ['クライアント', '田中 誠さん'],
              ['対話時間',     '22 分 18 秒'],
              ['発話数',       '23 ／ 田中 12 ・ あなた 11'],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                paddingBottom: 8, borderBottom: `1px dashed ${v2r.borderSoft}`,
              }}>
                <span style={{ color: v2r.ink3 }}>{k}</span>
                <span style={{ color: v2r.ink, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </V2_Card>

        {/* Right: 360 radar */}
        <V2_Card style={{ padding: '22px 24px', position: 'relative' }}>
          <V2_SectionTitle
            sub="自己評価と AI 評価を 6 軸で比較。ズレが大きいほど、メタ認知の伸びしろがあるサインです。"
            action={
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: v2r.blue }} />
                  <span style={{ fontFamily: v2r.sans, fontSize: 12, color: v2r.ink2, fontWeight: 500 }}>AI 評価</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: v2r.coral, opacity: 0.7,
                    border: `2px dashed ${v2r.coral}`, boxSizing: 'content-box',
                  }} />
                  <span style={{ fontFamily: v2r.sans, fontSize: 12, color: v2r.ink2, fontWeight: 500 }}>自己評価</span>
                </div>
              </div>
            }
          >
            360° パフォーマンス
          </V2_SectionTitle>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'center',
          }}>
            <div style={{ display: 'grid', placeItems: 'center' }}>
              <V2_Radar size={360} />
            </div>

            {/* axis breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {V2_AXES.map((a) => {
                const gap = a.self - a.ai;
                const aiPct = (a.ai / a.max) * 100;
                const selfPct = (a.self / a.max) * 100;
                return (
                  <div key={a.key} style={{
                    display: 'grid', gridTemplateColumns: '92px 1fr 60px',
                    alignItems: 'center', gap: 12,
                    padding: '6px 0',
                    borderBottom: `1px dashed ${v2r.borderSoft}`,
                  }}>
                    <div>
                      <div style={{ fontFamily: v2r.round, fontWeight: 700, fontSize: 13, color: v2r.ink }}>
                        {a.label}
                      </div>
                      <div style={{ fontFamily: v2r.sans, fontSize: 10, color: v2r.ink3 }}>{a.short}</div>
                    </div>
                    {/* twin bars */}
                    <div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: v2r.blue }} />
                        <div style={{
                          flex: 1, height: 5, background: v2r.bg, borderRadius: 3, overflow: 'hidden',
                        }}>
                          <div style={{ width: `${aiPct}%`, height: '100%', background: v2r.blue }} />
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: v2r.coral }} />
                        <div style={{
                          flex: 1, height: 5, background: v2r.bg, borderRadius: 3, overflow: 'hidden',
                        }}>
                          <div style={{ width: `${selfPct}%`, height: '100%', background: v2r.coral }} />
                        </div>
                      </div>
                    </div>
                    {/* gap chip */}
                    <div style={{
                      textAlign: 'right',
                      fontFamily: v2r.round, fontWeight: 700, fontSize: 12,
                      color: Math.abs(gap) >= 3 ? v2r.coral
                           : Math.abs(gap) >= 2 ? v2r.orange : v2r.green,
                    }}>
                      {gap >= 0 ? '+' : ''}{gap}
                      <div style={{ fontFamily: v2r.sans, fontSize: 9, color: v2r.ink3, fontWeight: 500 }}>
                        ギャップ
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </V2_Card>
      </div>

      {/* Row 2: Strengths/Improvements + AI feedback */}
      <div style={{
        display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, marginBottom: 18,
      }}>
        <V2_Card style={{ padding: '22px 24px' }}>
          <V2_SectionTitle sub="今回の練習からの所見">詳細分析</V2_SectionTitle>

          <div style={{
            background: v2r.greenLite, borderRadius: 12, padding: '14px 16px', marginBottom: 12,
          }}>
            <div style={{
              fontFamily: v2r.round, fontWeight: 700, fontSize: 12, color: '#2d7a36', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>✔</span> 強み
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['傾聴', '共感', 'Presence'].map(t => (
                <div key={t} style={{ fontFamily: v2r.sans, fontSize: 13, color: v2r.ink, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t}</span>
                  <span style={{ fontFamily: v2r.round, fontSize: 12, fontWeight: 600, color: '#2d7a36' }}>
                    高水準で安定
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: v2r.coralLite, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{
              fontFamily: v2r.round, fontWeight: 700, fontSize: 12, color: '#b3433f', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 14 }}>⚠</span> 余白
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['質問力', '+3 を狙いたい'], ['主張力', '+5 を狙いたい']].map(([t, hint]) => (
                <div key={t} style={{ fontFamily: v2r.sans, fontSize: 13, color: v2r.ink, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t}</span>
                  <span style={{ fontFamily: v2r.round, fontSize: 12, fontWeight: 600, color: '#b3433f' }}>
                    {hint}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* improvement check from last time */}
          <div style={{
            marginTop: 16, paddingTop: 16, borderTop: `1px solid ${v2r.borderSoft}`,
          }}>
            <div style={{
              fontFamily: v2r.round, fontWeight: 700, fontSize: 12, color: v2r.ink3,
              letterSpacing: '0.1em', marginBottom: 10, textTransform: 'uppercase',
            }}>前回の宿題 ／ Review</div>
            {e.review.map((r, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: r.addressed ? v2r.green : v2r.surface,
                  border: `1.5px solid ${r.addressed ? v2r.green : v2r.coral}`,
                  color: '#fff', display: 'grid', placeItems: 'center',
                  fontFamily: v2r.round, fontSize: 10, fontWeight: 700, flexShrink: 0,
                  marginTop: 2,
                }}>{r.addressed ? '✓' : '−'}</div>
                <div>
                  <div style={{ fontFamily: v2r.sans, fontSize: 12.5, color: v2r.ink, fontWeight: 500 }}>
                    {r.item}
                  </div>
                  <div style={{ fontFamily: v2r.sans, fontSize: 11, color: v2r.ink3, marginTop: 2, lineHeight: 1.6 }}>
                    {r.comment}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </V2_Card>

        {/* AI feedback (tiered, expandable) */}
        <V2_Card style={{ padding: '22px 24px' }}>
          <V2_SectionTitle
            sub="今回のセッションを 3 つの観点で分解しました。クリックで展開できます。"
            action={
              <div style={{
                background: v2r.blueLite, color: v2r.blue,
                padding: '4px 10px', borderRadius: 999,
                fontFamily: v2r.round, fontSize: 11, fontWeight: 700,
              }}>💡 AI からのフィードバック</div>
            }
          >ふりかえり</V2_SectionTitle>

          {[
            {
              id: 'good',
              icon: '✅', color: v2r.green, bg: v2r.greenLite, dark: '#2d7a36',
              title: '良かった点',
              count: e.strengths.length,
              items: e.strengths.map((t, i) => ({
                title: t,
                detail: [
                  '「気まずい空気のまま」の発言を 2 度繰り返し、感情をラベリングできていました。',
                  '感情語（不安・焦り）を 4 回ミラーリングし、安心して話せる場をつくれていました。',
                  'クライアントの言葉を遮らず、平均 1.2 秒の沈黙を許容できていました。',
                ][i],
              })),
            },
            {
              id: 'fix',
              icon: '📈', color: v2r.coral, bg: v2r.coralLite, dark: '#b3433f',
              title: '改善できる点',
              count: e.improvements.length,
              items: e.improvements.map((t, i) => ({
                title: t,
                detail: [
                  '「なぜ」を 3 回使用していました。「何が／どのように」へ置き換えると、原因→行動が分けやすくなります。',
                  '14:18〜14:23 の沈黙のあと、視点を「3 ヶ月後の自分」にずらす問いを試してみてください。',
                  'セッション終盤の 2 分間、ゴール再確認の時間を確保しましょう。',
                ][i],
              })),
            },
            {
              id: 'next',
              icon: '🎯', color: v2r.blue, bg: v2r.blueLite, dark: v2r.blueDeep,
              title: '次の練習で意識すること',
              count: 3,
              items: [
                { title: 'オープンクエスチョンを 3 つ以上', detail: '「何が／どのように／いつ」で始める問いを意識的に。' },
                { title: '主張は「私は〜」で始める',         detail: '「あなたは〜」を避け、I メッセージで言い直してみる。' },
                { title: '3 分ごとに要約を入れる',           detail: '「ここまでで聞いた話は…」と中継ぎを置く。' },
              ],
            },
          ].map(group => {
            const open = expanded === group.id;
            return (
              <div key={group.id} style={{
                marginBottom: 10, borderRadius: 14,
                background: group.bg,
                border: `1px solid ${open ? group.color : 'transparent'}`,
                transition: 'all 0.15s',
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpanded(open ? null : group.id)}
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    padding: '14px 18px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                  <span style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: '#fff', color: group.dark,
                    display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0,
                  }}>{group.icon}</span>
                  <div style={{
                    fontFamily: v2r.round, fontWeight: 700, fontSize: 14, color: group.dark,
                    flex: 1,
                  }}>{group.title}<span style={{ marginLeft: 8, color: group.color, fontSize: 12 }}>
                    {group.count} 件
                  </span></div>
                  <span style={{
                    fontFamily: v2r.round, fontSize: 14, color: group.dark, fontWeight: 700,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}>⌄</span>
                </button>
                {open && (
                  <div style={{ padding: '0 18px 16px' }}>
                    {group.items.map((it, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 12, padding: '10px 0',
                        borderTop: `1px dashed ${v2r.border}`,
                      }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: '#fff', color: group.dark,
                          display: 'grid', placeItems: 'center',
                          fontFamily: v2r.round, fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>{i + 1}</span>
                        <div>
                          <div style={{ fontFamily: v2r.round, fontWeight: 600, fontSize: 13.5, color: v2r.ink, marginBottom: 4 }}>
                            {it.title}
                          </div>
                          <div style={{ fontFamily: v2r.sans, fontSize: 12, color: v2r.ink2, lineHeight: 1.75 }}>
                            {it.detail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginTop: 16,
            paddingTop: 14, borderTop: `1px solid ${v2r.borderSoft}`,
          }}>
            <button style={{
              background: 'transparent', color: v2r.ink2,
              border: `1px solid ${v2r.border}`,
              borderRadius: 10, padding: '10px 16px',
              fontFamily: v2r.round, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>← 前の練習</button>
            <div style={{ flex: 1 }} />
            <button style={{
              background: v2r.coral, color: '#fff',
              border: 'none', borderRadius: 10, padding: '12px 22px',
              fontFamily: v2r.round, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 10px 22px -10px ${v2r.coral}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              次の練習を始める <span style={{ fontSize: 14 }}>▶</span>
            </button>
          </div>
        </V2_Card>
      </div>

      {/* Row 3: Growth trend full-width */}
      <V2_Card style={{ padding: '22px 24px' }}>
        <V2_SectionTitle
          sub="過去 10 回のセッションスコア。続けるほど、傾向は確かに登っていきます。"
          action={
            <div style={{ display: 'flex', gap: 6 }}>
              {['10 回', '30 回', '全期間'].map((t, i) => (
                <button key={t} style={{
                  fontFamily: v2r.round, fontWeight: 600, fontSize: 12,
                  padding: '6px 12px', borderRadius: 8,
                  background: i === 0 ? v2r.ink : 'transparent',
                  color: i === 0 ? '#fff' : v2r.ink2,
                  border: i === 0 ? 'none' : `1px solid ${v2r.border}`,
                  cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          }
        >成長トレンド</V2_SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'center' }}>
          <V2_GrowthChart width={680} height={200} />
          <div>
            {[
              { k: '平均スコア',   v: '63 点',     d: '初回比 +40' },
              { k: '上昇傾向',     v: '4 回連続',   d: '止まらず登る' },
              { k: '練習頻度',     v: '週 2.3 回', d: '理想ペース' },
              { k: '到達まで',     v: 'あと 18 点', d: '目標 100 点' },
            ].map(s => (
              <div key={s.k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '12px 0', borderBottom: `1px dashed ${v2r.borderSoft}`,
              }}>
                <div>
                  <div style={{ fontFamily: v2r.sans, fontSize: 11, color: v2r.ink3 }}>{s.k}</div>
                  <div style={{ fontFamily: v2r.round, fontSize: 18, fontWeight: 700, color: v2r.ink, marginTop: 2 }}>{s.v}</div>
                </div>
                <div style={{ fontFamily: v2r.sans, fontSize: 11, color: v2r.ink3 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </V2_Card>
    </div>
  );
};
