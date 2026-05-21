"use client";

import React from "react";

interface CharacterAvatarProps {
  clientName: string;
  speaking: boolean;
  loading?: boolean;
}

/* ── Shared animation styles ── */
const blinkAnim = {
  transformBox: "fill-box",
  transformOrigin: "center",
  animation: "eyeBlink 4.5s ease-in-out infinite",
} as React.CSSProperties;

const blinkAnimDelay = {
  transformBox: "fill-box",
  transformOrigin: "center",
  animation: "eyeBlink 4.5s ease-in-out 0.06s infinite",
} as React.CSSProperties;

const speakAnim = {
  transformBox: "fill-box",
  transformOrigin: "center",
  animation: "speakMouth 0.35s ease-in-out infinite alternate",
} as React.CSSProperties;

/* ═════════════════════════════════════════════
   田中 誠 — Navy suit, black rectangular glasses, spiky anime hair
═════════════════════════════════════════════ */
function TanakaMakoto({ speaking }: { speaking: boolean }) {
  const skin = "#f5c5a0";
  const skinShadow = "#d8a878";
  const hair = "#18181a";

  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">

      {/* ── OUTFIT ── */}
      {/* Neck shadow */}
      <path d="M72,136 Q80,142 88,136 L88,154 Q80,158 72,154 Z" fill={skinShadow} />
      {/* Navy suit body */}
      <path d="M14,200 L14,170 Q28,148 64,144 L70,158 L80,172 L90,158 L96,144 Q132,148 146,170 L146,200 Z" fill="#1e3a8a" />
      {/* Left lapel */}
      <path d="M64,144 L70,158 L80,172 L72,164 Q54,154 44,146 Z" fill="#162f72" />
      {/* Right lapel */}
      <path d="M96,144 L90,158 L80,172 L88,164 Q106,154 116,146 Z" fill="#162f72" />
      {/* White shirt */}
      <path d="M73,144 L76,160 L80,172 L84,160 L87,144 L80,150 Z" fill="white" />
      {/* Navy striped tie */}
      <path d="M77.5,151 L80,172 L82.5,151 L80,156 Z" fill="#1e3a8a" />
      <line x1="78.2" y1="155" x2="81.8" y2="155" stroke="rgba(200,220,255,0.3)" strokeWidth="1" transform="rotate(-20 80 155)" />
      <line x1="78.2" y1="160" x2="81.8" y2="160" stroke="rgba(200,220,255,0.3)" strokeWidth="1" transform="rotate(-20 80 160)" />
      <line x1="78.5" y1="165" x2="81.5" y2="165" stroke="rgba(200,220,255,0.3)" strokeWidth="1" transform="rotate(-20 80 165)" />
      {/* Suit pocket */}
      <path d="M113,165 L128,165 L128,172 L113,172" fill="none" stroke="#162f72" strokeWidth="1.2" />

      {/* ── NECK ── */}
      <rect x="71" y="132" width="18" height="18" rx="2" fill={skin} />

      {/* ── EAR (before face) ── */}
      <ellipse cx="37" cy="90" rx="5" ry="7" fill={skin} />
      <ellipse cx="123" cy="90" rx="5" ry="7" fill={skin} />
      <path d="M35,87 Q38,92 35,97" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M125,87 Q122,92 125,97" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.5" />

      {/* ── BACK HAIR (behind face) ── */}
      <ellipse cx="80" cy="76" rx="47" ry="42" fill={hair} />

      {/* ── FACE (oval, anime proportions) ── */}
      <path d="M40,76 Q36,108 56,128 Q68,140 80,142 Q92,140 104,128 Q124,108 120,76 Q114,44 80,42 Q46,44 40,76 Z" fill={skin} />

      {/* Cheek shadow */}
      <ellipse cx="50" cy="102" rx="11" ry="6" fill={skinShadow} opacity="0.18" />
      <ellipse cx="110" cy="102" rx="11" ry="6" fill={skinShadow} opacity="0.18" />

      {/* ── FRONT HAIR (anime spiky style, drawn over face) ── */}
      {/* Main hair top cap */}
      <path d="M40,76 Q46,44 80,38 Q114,44 120,76 Q110,56 80,54 Q50,56 40,76 Z" fill={hair} />

      {/* Spiky strand 1 – far left */}
      <path d="M44,66 Q38,46 40,30 Q46,46 50,64 Z" fill={hair} />
      {/* Spiky strand 2 */}
      <path d="M56,50 Q52,30 56,16 Q62,34 64,50 Z" fill={hair} />
      {/* Spiky strand 3 */}
      <path d="M69,44 Q67,24 72,10 Q77,28 76,44 Z" fill={hair} />
      {/* Spiky strand 4 – center */}
      <path d="M80,40 Q80,20 84,8 Q88,24 86,40 Z" fill={hair} />
      {/* Spiky strand 5 */}
      <path d="M92,44 Q96,24 100,14 Q102,30 98,46 Z" fill={hair} />
      {/* Spiky strand 6 – far right */}
      <path d="M108,54 Q114,36 118,26 Q116,44 110,58 Z" fill={hair} />

      {/* Left side bang sweeping across forehead */}
      <path d="M42,72 Q50,52 68,58 Q60,70 48,78 Z" fill={hair} />
      {/* Small right side tuft */}
      <path d="M114,70 Q118,82 116,92 Q112,84 112,74 Z" fill={hair} />

      {/* ── EYEBROWS ── */}
      <path d="M50,72 Q63,64 76,68" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M84,68 Q97,64 110,72" stroke={hair} strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* ── EYES (anime-proportioned, horizontal) ── */}
      {/* Left eye */}
      <g style={blinkAnim}>
        <ellipse cx="63" cy="80" rx="11" ry="8" fill="white" />
        <ellipse cx="63" cy="80" rx="7.5" ry="7" fill="#3a2510" />
        <ellipse cx="63" cy="80" rx="4.5" ry="5" fill="#0d0d0d" />
        <ellipse cx="60" cy="77" rx="2.5" ry="2" fill="white" opacity="0.75" />
        {/* Lower lid line */}
        <path d="M52,84 Q63,87 74,84" fill="none" stroke={skinShadow} strokeWidth="1" opacity="0.5" />
      </g>
      {/* Right eye */}
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="80" rx="11" ry="8" fill="white" />
        <ellipse cx="97" cy="80" rx="7.5" ry="7" fill="#3a2510" />
        <ellipse cx="97" cy="80" rx="4.5" ry="5" fill="#0d0d0d" />
        <ellipse cx="94" cy="77" rx="2.5" ry="2" fill="white" opacity="0.75" />
        {/* Lower lid line */}
        <path d="M86,84 Q97,87 108,84" fill="none" stroke={skinShadow} strokeWidth="1" opacity="0.5" />
      </g>

      {/* ── NOSE (anime minimal) ── */}
      <path d="M77,96 Q80,101 83,96" stroke={skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" />

      {/* ── MOUTH ── */}
      {speaking ? (
        <ellipse cx="80" cy="114" rx="9" ry="6.5" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <path d="M72,112 Q80,119 88,112" stroke="#b08878" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* ── GLASSES (black rectangular frames) ── */}
      <rect x="49" y="73" width="27" height="15" rx="2" stroke="#111" strokeWidth="2.5" fill="rgba(180,210,255,0.04)" />
      <rect x="84" y="73" width="27" height="15" rx="2" stroke="#111" strokeWidth="2.5" fill="rgba(180,210,255,0.04)" />
      {/* Bridge */}
      <line x1="76" y1="80.5" x2="84" y2="80.5" stroke="#111" strokeWidth="2" />
      {/* Left temple */}
      <line x1="49" y1="80.5" x2="41" y2="83" stroke="#111" strokeWidth="2" />
      {/* Right temple */}
      <line x1="111" y1="80.5" x2="119" y2="83" stroke="#111" strokeWidth="2" />
    </svg>
  );
}

/* ═════════════════════════════════════════════
   佐藤 美咲 — Purple blazer, long flowing hair, drop earrings
═════════════════════════════════════════════ */
function SatoMisaki({ speaking }: { speaking: boolean }) {
  const skin = "#f5cba8";
  const skinShadow = "#dba880";
  const hair = "#1c1520";
  const blazer = "#6B38A0";

  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">

      {/* ── OUTFIT ── */}
      {/* Neck shadow */}
      <rect x="71" y="134" width="18" height="18" rx="2" fill={skinShadow} />
      {/* Long hair strands in front of outfit — left */}
      <path d="M34,92 Q22,130 26,174 Q32,184 42,180 Q37,155 39,124 Q43,100 38,92 Z" fill={hair} />
      {/* Long hair strands — right */}
      <path d="M126,92 Q138,130 134,174 Q128,184 118,180 Q123,155 121,124 Q117,100 122,92 Z" fill={hair} />
      {/* Additional thin right strand */}
      <path d="M120,94 Q132,132 130,170 Q126,178 122,175 Q126,150 124,120 Q120,100 120,94 Z" fill={hair} opacity="0.6" />
      {/* Purple blazer */}
      <path d="M14,200 L14,170 Q28,148 64,144 L70,158 L80,172 L90,158 L96,144 Q132,148 146,170 L146,200 Z" fill={blazer} />
      {/* Left lapel */}
      <path d="M64,144 L70,158 L80,172 L72,164 Q54,154 44,146 Z" fill="#572E84" />
      {/* Right lapel */}
      <path d="M96,144 L90,158 L80,172 L88,164 Q106,154 116,146 Z" fill="#572E84" />
      {/* Suit pocket */}
      <path d="M112,163 L126,163 L126,170 L112,170" fill="none" stroke="#572E84" strokeWidth="1.2" />
      {/* White/cream blouse — V-neck */}
      <path d="M72,144 L78,160 L80,172 L82,160 L88,144 Q80,152 72,144 Z" fill="#ede8e0" />

      {/* ── NECK ── */}
      <rect x="71" y="130" width="18" height="20" rx="2" fill={skin} />

      {/* ── EAR (before face) ── */}
      <ellipse cx="38" cy="90" rx="5" ry="7.5" fill={skin} />
      <ellipse cx="122" cy="90" rx="5" ry="7.5" fill={skin} />
      <path d="M36,87 Q39,92 36,97" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.45" />
      <path d="M124,87 Q121,92 124,97" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.45" />

      {/* ── BACK HAIR (behind face) ── */}
      <ellipse cx="80" cy="76" rx="48" ry="44" fill={hair} />

      {/* ── FACE (anime oval, narrowing chin) ── */}
      <path d="M42,76 Q38,108 56,130 Q68,144 80,146 Q92,144 104,130 Q122,108 118,76 Q112,44 80,42 Q48,44 42,76 Z" fill={skin} />

      {/* Cheek blush — warm pink */}
      <ellipse cx="51" cy="104" rx="13" ry="7" fill="#f0a090" opacity="0.32" />
      <ellipse cx="109" cy="104" rx="13" ry="7" fill="#f0a090" opacity="0.32" />

      {/* ── FRONT HAIR (drawn over face) ── */}
      {/* Main hair top with slight center-left parting */}
      <path d="M42,76 Q48,44 80,40 Q112,44 118,76 Q108,58 80,56 Q52,58 42,76 Z" fill={hair} />
      {/* Hair body left side */}
      <path d="M42,76 Q36,86 36,104 Q40,94 44,84 Z" fill={hair} />
      {/* Hair body right side */}
      <path d="M118,76 Q124,86 124,104 Q120,94 116,84 Z" fill={hair} />
      {/* Left-sweep bang crossing forehead */}
      <path d="M44,74 Q56,52 74,58 Q64,72 50,80 Z" fill={hair} />
      {/* Thin strand across left eye area */}
      <path d="M52,74 Q60,64 70,66 Q64,74 56,80 Z" fill={hair} opacity="0.75" />

      {/* ── GOLD DROP EARRINGS ── */}
      {/* Left — small post + oval hoop below */}
      <circle cx="37" cy="96" r="2.2" fill="#c8900a" />
      <ellipse cx="37" cy="106" rx="3.5" ry="5.5" fill="none" stroke="#c8900a" strokeWidth="2.2" />
      {/* Right */}
      <circle cx="123" cy="96" r="2.2" fill="#c8900a" />
      <ellipse cx="123" cy="106" rx="3.5" ry="5.5" fill="none" stroke="#c8900a" strokeWidth="2.2" />

      {/* ── EYEBROWS — soft flat-gentle arch, warm brown ── */}
      <path d="M52,68 Q63,63 74,66" stroke="#4a3020" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M86,66 Q97,63 108,68" stroke="#4a3020" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      {/* ── EYES — anime female, open warm expression ── */}
      {/* Left eye */}
      <g style={blinkAnim}>
        <ellipse cx="63" cy="80" rx="10.5" ry="9.5" fill="white" />
        <ellipse cx="63" cy="81" rx="7" ry="7.5" fill="#6b4028" />
        <ellipse cx="63" cy="81" rx="4.5" ry="5" fill="#180808" />
        <ellipse cx="59.5" cy="77" rx="3" ry="2.2" fill="white" opacity="0.9" />
        <ellipse cx="67" cy="83.5" rx="1.2" ry="1" fill="white" opacity="0.45" />
        {/* Lower lash — very subtle */}
        <path d="M53,87 Q63,89.5 73,87" fill="none" stroke="#4a3020" strokeWidth="0.6" opacity="0.25" />
      </g>
      {/* Right eye */}
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="80" rx="10.5" ry="9.5" fill="white" />
        <ellipse cx="97" cy="81" rx="7" ry="7.5" fill="#6b4028" />
        <ellipse cx="97" cy="81" rx="4.5" ry="5" fill="#180808" />
        <ellipse cx="93.5" cy="77" rx="3" ry="2.2" fill="white" opacity="0.9" />
        <ellipse cx="101" cy="83.5" rx="1.2" ry="1" fill="white" opacity="0.45" />
        {/* Lower lash — very subtle */}
        <path d="M87,87 Q97,89.5 107,87" fill="none" stroke="#4a3020" strokeWidth="0.6" opacity="0.25" />
      </g>

      {/* ── NOSE (anime minimal) ── */}
      <path d="M78,95 Q80,100 82,95" stroke={skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />

      {/* ── MOUTH — warm soft smile ── */}
      {speaking ? (
        <ellipse cx="80" cy="114" rx="9" ry="6.5" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <>
          <path d="M71,112 Q80,120 89,112" stroke="#c07870" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M74,112 Q80,116 86,112" stroke="#d88878" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55" />
        </>
      )}
    </svg>
  );
}

/* ═════════════════════════════════════════════
   鈴木 健一 — Dark teal open-collar shirt, wild messy black hair,
               half-lidded calm eyes, stubble, angular face (35歳)
═════════════════════════════════════════════ */
function SuzukiKenichi({ speaking }: { speaking: boolean }) {
  const skin = "#e4b878";
  const skinShadow = "#c09060";
  const hair = "#0c0c14";
  const shirt = "#1d6470";

  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">

      {/* ── OUTFIT — open collar teal shirt ── */}
      {/* Neck shadow behind collar */}
      <rect x="71" y="132" width="18" height="20" rx="2" fill={skinShadow} />
      {/* Shirt body */}
      <path d="M14,200 L14,170 Q30,148 64,145 L70,158 L80,170 L90,158 L96,145 Q130,148 146,170 L146,200 Z" fill={shirt} />
      {/* Shirt shadow fold */}
      <path d="M14,200 L14,185 Q30,172 64,168 L70,178 L80,170 L90,178 L96,168 Q130,172 146,185 L146,200 Z" fill="#144e5a" opacity="0.35" />
      {/* Left collar panel */}
      <path d="M64,145 Q70,149 72,156 L80,152 L80,145 Z" fill="#144e5a" />
      {/* Right collar panel */}
      <path d="M96,145 Q90,149 88,156 L80,152 L80,145 Z" fill="#144e5a" />
      {/* Collar left point */}
      <path d="M58,143 Q64,140 70,148 Q66,147 60,148 Z" fill={shirt} />
      {/* Collar right point */}
      <path d="M102,143 Q96,140 90,148 Q94,147 100,148 Z" fill={shirt} />
      {/* Chest skin at open collar */}
      <path d="M70,148 L80,152 L90,148 L86,145 L80,150 L74,145 Z" fill={skinShadow} opacity="0.55" />
      {/* Shirt center placket */}
      <line x1="80" y1="152" x2="80" y2="200" stroke="#144e5a" strokeWidth="1" opacity="0.4" />
      {/* Buttons */}
      <circle cx="80" cy="162" r="1.5" fill="#144e5a" />
      <circle cx="80" cy="172" r="1.5" fill="#144e5a" />
      <circle cx="80" cy="182" r="1.5" fill="#144e5a" />
      {/* Chest pocket */}
      <path d="M108,158 L122,158 L122,167 L108,167" fill="none" stroke="#144e5a" strokeWidth="1.2" />

      {/* ── NECK ── */}
      <rect x="71" y="128" width="18" height="22" rx="2" fill={skin} />
      <path d="M71,130 Q74,148 71,150 L71,128 Z" fill={skinShadow} opacity="0.25" />
      <path d="M89,130 Q86,148 89,150 L89,128 Z" fill={skinShadow} opacity="0.25" />

      {/* ── EARS ── */}
      <ellipse cx="38" cy="90" rx="5" ry="7" fill={skin} />
      <ellipse cx="122" cy="90" rx="5" ry="7" fill={skin} />
      <path d="M36,87 Q39,92 36,97" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.45" />
      <path d="M124,87 Q121,92 124,97" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.45" />

      {/* ── BACK HAIR ── */}
      <ellipse cx="80" cy="74" rx="47" ry="42" fill={hair} />
      {/* Side hair hanging left */}
      <path d="M34,82 Q24,106 28,128 Q34,116 38,100 Z" fill={hair} />
      {/* Side hair hanging right */}
      <path d="M126,82 Q136,106 132,128 Q126,116 122,100 Z" fill={hair} />

      {/* ── FACE — angular, longer shape ── */}
      <path d="M42,82 Q38,112 50,134 Q62,152 80,155 Q98,152 110,134 Q122,112 118,82 Q112,48 80,46 Q48,48 42,82 Z" fill={skin} />

      {/* Cheek hollow shadow — gaunt/lean look */}
      <path d="M44,102 Q48,116 53,122 Q46,116 42,104 Z" fill={skinShadow} opacity="0.28" />
      <path d="M116,102 Q112,116 107,122 Q114,116 118,104 Z" fill={skinShadow} opacity="0.28" />
      {/* Under-eye fatigue shadow */}
      <ellipse cx="63" cy="89" rx="9" ry="3" fill={skinShadow} opacity="0.14" />
      <ellipse cx="97" cy="89" rx="9" ry="3" fill={skinShadow} opacity="0.14" />
      {/* Nose bridge subtle shadow */}
      <path d="M78,82 L77,102" stroke={skinShadow} strokeWidth="1.5" fill="none" opacity="0.2" strokeLinecap="round" />
      {/* Jaw definition */}
      <path d="M58,140 Q80,154 102,140" stroke={skinShadow} strokeWidth="1" fill="none" opacity="0.15" />

      {/* ── FRONT HAIR — wild messy volumious ── */}
      {/* Main hair crown */}
      <path d="M42,82 Q48,48 80,44 Q112,48 118,82 Q108,60 80,58 Q52,60 42,82 Z" fill={hair} />
      {/* Wild strands — spreading in all directions */}
      <path d="M44,72 Q30,58 24,44 Q36,56 44,70 Z" fill={hair} />
      <path d="M52,56 Q46,36 48,22 Q52,38 56,54 Z" fill={hair} />
      <path d="M62,50 Q58,28 62,14 Q66,32 66,50 Z" fill={hair} />
      <path d="M74,46 Q70,24 76,10 Q80,28 78,46 Z" fill={hair} />
      <path d="M84,44 Q86,20 90,8 Q90,28 88,46 Z" fill={hair} />
      <path d="M96,48 Q100,26 104,16 Q102,34 98,50 Z" fill={hair} />
      <path d="M106,56 Q114,36 118,24 Q114,42 108,58 Z" fill={hair} />
      <path d="M116,70 Q130,56 136,44 Q124,56 116,72 Z" fill={hair} />
      {/* Forehead bangs */}
      <path d="M46,76 Q58,56 76,62 Q66,74 52,80 Z" fill={hair} />
      <path d="M54,72 Q66,62 78,66 Q70,76 58,80 Z" fill={hair} opacity="0.8" />

      {/* ── STUBBLE — realistic beard shadow ── */}
      <ellipse cx="80" cy="131" rx="22" ry="12" fill={hair} opacity="0.09" />
      <ellipse cx="80" cy="137" rx="16" ry="8" fill={hair} opacity="0.1" />
      {/* Stubble dot pattern */}
      <circle cx="73" cy="128" r="0.8" fill={hair} opacity="0.18" />
      <circle cx="78" cy="131" r="0.8" fill={hair} opacity="0.18" />
      <circle cx="82" cy="131" r="0.8" fill={hair} opacity="0.18" />
      <circle cx="87" cy="128" r="0.8" fill={hair} opacity="0.18" />
      <circle cx="70" cy="132" r="0.7" fill={hair} opacity="0.14" />
      <circle cx="90" cy="132" r="0.7" fill={hair} opacity="0.14" />
      <circle cx="75" cy="135" r="0.7" fill={hair} opacity="0.15" />
      <circle cx="80" cy="136" r="0.8" fill={hair} opacity="0.16" />
      <circle cx="85" cy="135" r="0.7" fill={hair} opacity="0.15" />
      <circle cx="68" cy="128" r="0.6" fill={hair} opacity="0.1" />
      <circle cx="92" cy="128" r="0.6" fill={hair} opacity="0.1" />

      {/* ── EYEBROWS — thick, straight, dark ── */}
      <path d="M50,73 Q63,70 76,72" stroke={hair} strokeWidth="3.8" fill="none" strokeLinecap="round" opacity="0.95" />
      <path d="M84,72 Q97,70 110,73" stroke={hair} strokeWidth="3.8" fill="none" strokeLinecap="round" opacity="0.95" />

      {/* ── EYES — half-lidded, calm/tired droopy ── */}
      {/* Left eye */}
      <g style={blinkAnim}>
        <ellipse cx="63" cy="82" rx="11" ry="6.5" fill="white" />
        <ellipse cx="63" cy="83" rx="7.5" ry="5.5" fill="#28180c" />
        <ellipse cx="63" cy="83" rx="4.5" ry="4.2" fill="#0c0808" />
        <ellipse cx="60.5" cy="80.5" rx="2.2" ry="1.6" fill="white" opacity="0.5" />
        {/* Heavy drooping upper eyelid — covers top ~40% */}
        <path d="M52,79 Q63,74 74,79" fill={skin} />
        <path d="M52,79 Q63,74 74,79" fill="none" stroke={hair} strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {/* Right eye */}
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="82" rx="11" ry="6.5" fill="white" />
        <ellipse cx="97" cy="83" rx="7.5" ry="5.5" fill="#28180c" />
        <ellipse cx="97" cy="83" rx="4.5" ry="4.2" fill="#0c0808" />
        <ellipse cx="94.5" cy="80.5" rx="2.2" ry="1.6" fill="white" opacity="0.5" />
        {/* Heavy drooping upper eyelid */}
        <path d="M86,79 Q97,74 108,79" fill={skin} />
        <path d="M86,79 Q97,74 108,79" fill="none" stroke={hair} strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* ── NOSE — more prominent/realistic ── */}
      <path d="M76,100 Q80,107 84,100" stroke={skinShadow} strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.65" />
      <path d="M79,82 L78,100" stroke={skinShadow} strokeWidth="1" fill="none" opacity="0.2" strokeLinecap="round" />
      <ellipse cx="77" cy="102" rx="2.2" ry="1.2" fill={skinShadow} opacity="0.2" />
      <ellipse cx="83" cy="102" rx="2.2" ry="1.2" fill={skinShadow} opacity="0.2" />

      {/* ── MOUTH — flat neutral expression ── */}
      {speaking ? (
        <ellipse cx="80" cy="116" rx="9" ry="6.5" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <>
          <path d="M72,116 Q80,119 88,116" stroke="#b08878" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M74,116 Q80,118 86,116" stroke="#c8a090" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.45" />
        </>
      )}
    </svg>
  );
}

/* ═════════════════════════════════════════════
   Default — Indigo top, clean look
═════════════════════════════════════════════ */
function DefaultCharacter({ speaking }: { speaking: boolean }) {
  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">
      {/* Neck shadow */}
      <rect x="70" y="134" width="20" height="18" rx="2" fill="#e0a880" />
      {/* Indigo top */}
      <path d="M22,168 Q38,150 68,148 L72,160 L80,170 L88,160 L92,148 Q122,150 138,168 L138,200 L22,200 Z" fill="#3730a3" />
      <path d="M74,148 L77,162 L80,170 L83,162 L86,148 L80,155 Z" fill="#4338ca" opacity="0.5" />
      {/* Neck skin */}
      <rect x="70" y="131" width="20" height="20" rx="2" fill="#f5c4a0" />
      {/* Hair back */}
      <ellipse cx="80" cy="81" rx="47" ry="44" fill="#374151" />
      {/* Hair top */}
      <path d="M36,85 Q43,44 80,41 Q117,44 124,85 Q110,57 80,55 Q50,57 36,85 Z" fill="#374151" />
      {/* Face */}
      <ellipse cx="80" cy="89" rx="44" ry="47" fill="#f5c4a0" />
      {/* Cheek blush */}
      <ellipse cx="55" cy="97" rx="9" ry="5" fill="#f0a88a" opacity="0.2" />
      <ellipse cx="105" cy="97" rx="9" ry="5" fill="#f0a88a" opacity="0.2" />
      {/* Eyebrows */}
      <path d="M54,71 Q63,65 73,69" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M87,69 Q97,65 106,71" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Left eye */}
      <g style={blinkAnim}>
        <ellipse cx="63" cy="80" rx="8" ry="7" fill="white" />
        <ellipse cx="63" cy="80" rx="5.5" ry="5.5" fill="#1a1a2e" />
        <ellipse cx="61" cy="78" rx="2" ry="1.5" fill="white" opacity="0.6" />
      </g>
      {/* Right eye */}
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="80" rx="8" ry="7" fill="white" />
        <ellipse cx="97" cy="80" rx="5.5" ry="5.5" fill="#1a1a2e" />
        <ellipse cx="95" cy="78" rx="2" ry="1.5" fill="white" opacity="0.6" />
      </g>
      {/* Nose */}
      <path d="M76,93 Q80,99 84,93" stroke="#c09880" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Mouth */}
      {speaking ? (
        <ellipse cx="80" cy="107" rx="10" ry="7" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <path d="M70,105 Q80,114 90,105" stroke="#c08878" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ═════════════════════════════════════════════
   Main export
═════════════════════════════════════════════ */
export default function CharacterAvatar({
  clientName,
  speaking,
  loading = false,
}: CharacterAvatarProps) {
  const charType = clientName.includes("田中")
    ? "tanaka"
    : clientName.includes("佐藤")
    ? "sato"
    : clientName.includes("鈴木")
    ? "suzuki"
    : "default";

  const floatStyle: React.CSSProperties = {
    display: "block",
    animation: speaking
      ? "characterBob 1.5s ease-in-out infinite"
      : "characterFloat 4s ease-in-out infinite",
    filter: speaking
      ? "drop-shadow(0 0 22px rgba(99,102,241,0.4))"
      : "drop-shadow(0 0 6px rgba(255,255,255,0.03))",
    transition: "filter 0.5s ease",
  };

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 200, height: 195 }}
    >
      {/* Speaking pulse rings */}
      {speaking && (
        <>
          <div
            className="absolute rounded-full border border-indigo-400/15"
            style={{
              width: 175,
              height: 175,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div
            className="absolute rounded-full border border-indigo-400/20"
            style={{
              width: 148,
              height: 148,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "ping 2s cubic-bezier(0,0,0.2,1) 0.5s infinite",
            }}
          />
        </>
      )}

      {/* Loading spinner */}
      {loading && (
        <div
          className="absolute rounded-full"
          style={{
            width: 158,
            height: 158,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid transparent",
            borderTopColor: "rgba(99,102,241,0.6)",
            animation: "spin 1s linear infinite",
          }}
        />
      )}

      {/* Character with float animation */}
      <div style={floatStyle}>
        {charType === "tanaka"  && <TanakaMakoto  speaking={speaking} />}
        {charType === "sato"    && <SatoMisaki    speaking={speaking} />}
        {charType === "suzuki"  && <SuzukiKenichi speaking={speaking} />}
        {charType === "default" && <DefaultCharacter speaking={speaking} />}
      </div>
    </div>
  );
}
