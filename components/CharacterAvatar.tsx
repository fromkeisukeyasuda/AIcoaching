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
   佐藤 美咲 — Violet blazer, long dark hair, warm smile
═════════════════════════════════════════════ */
function SatoMisaki({ speaking }: { speaking: boolean }) {
  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">
      {/* Neck shadow */}
      <rect x="70" y="134" width="20" height="18" rx="2" fill="#e8b890" />
      {/* Long hair strands in front of outfit */}
      <path d="M35,92 Q27,125 31,166 Q37,176 43,172 Q39,147 41,117 Q45,97 39,92 Z" fill="#1a0a20" />
      <path d="M125,92 Q133,125 129,166 Q123,176 117,172 Q121,147 119,117 Q115,97 121,92 Z" fill="#1a0a20" />
      {/* Violet blazer */}
      <path d="M18,172 Q33,150 68,148 L72,162 L80,173 L88,162 L92,148 Q127,150 142,172 L142,200 L18,200 Z" fill="#6d28d9" />
      {/* Left lapel highlight */}
      <path d="M68,148 L72,162 L80,173 L71,165 Q55,156 48,150 Z" fill="#a78bfa" opacity="0.35" />
      {/* Right lapel highlight */}
      <path d="M92,148 L88,162 L80,173 L89,165 Q105,156 112,150 Z" fill="#a78bfa" opacity="0.35" />
      {/* Light blouse at center */}
      <path d="M73,148 L77,163 L80,173 L83,163 L87,148 L80,155 Z" fill="#f3e8ff" />
      {/* Neck skin */}
      <rect x="70" y="131" width="20" height="20" rx="2" fill="#f8d0b0" />
      {/* Hair back */}
      <ellipse cx="80" cy="80" rx="48" ry="44" fill="#1a0a20" />
      {/* Hair top */}
      <path d="M35,85 Q40,42 80,39 Q120,42 125,85 Q110,55 80,53 Q50,55 35,85 Z" fill="#1a0a20" />
      {/* Face */}
      <ellipse cx="80" cy="89" rx="44" ry="47" fill="#f8d0b0" />
      {/* Cheek blush — warm */}
      <ellipse cx="54" cy="97" rx="10" ry="6" fill="#f4a0a0" opacity="0.3" />
      <ellipse cx="106" cy="97" rx="10" ry="6" fill="#f4a0a0" opacity="0.3" />
      {/* Gold earrings */}
      <circle cx="36" cy="98" r="4.5" fill="#f59e0b" />
      <circle cx="36" cy="98" r="2.5" fill="#fcd34d" />
      <circle cx="124" cy="98" r="4.5" fill="#f59e0b" />
      <circle cx="124" cy="98" r="2.5" fill="#fcd34d" />
      {/* Eyebrows — soft arched */}
      <path d="M53,69 Q63,63 73,67" stroke="#1a0a20" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M87,67 Q97,63 107,69" stroke="#1a0a20" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Left eye — large/bright */}
      <g style={blinkAnim}>
        <ellipse cx="63" cy="79" rx="9" ry="8" fill="white" />
        <ellipse cx="63" cy="79" rx="6" ry="6.5" fill="#1a0a10" />
        <ellipse cx="60.5" cy="76.5" rx="2.5" ry="2" fill="white" opacity="0.7" />
      </g>
      {/* Right eye */}
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="79" rx="9" ry="8" fill="white" />
        <ellipse cx="97" cy="79" rx="6" ry="6.5" fill="#1a0a10" />
        <ellipse cx="94.5" cy="76.5" rx="2.5" ry="2" fill="white" opacity="0.7" />
      </g>
      {/* Nose */}
      <path d="M77,92 Q80,98 83,92" stroke="#d0a880" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Warm smile */}
      {speaking ? (
        <ellipse cx="80" cy="108" rx="10" ry="7" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <path d="M68,104 Q80,116 92,104" stroke="#d17b7b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ═════════════════════════════════════════════
   鈴木 健一 — Teal casual, messy hair, tired expression
═════════════════════════════════════════════ */
function SuzukiKenichi({ speaking }: { speaking: boolean }) {
  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">
      {/* Neck shadow */}
      <rect x="70" y="134" width="20" height="18" rx="2" fill="#d8a878" />
      {/* Teal casual shirt */}
      <path d="M22,168 Q38,150 68,148 L72,157 L80,167 L88,157 L92,148 Q122,150 138,168 L138,200 L22,200 Z" fill="#065f46" />
      {/* Open collar detail */}
      <path d="M73,148 L76,158 L80,167 L84,158 L87,148 L80,154 Z" fill="#047857" />
      {/* Collar shadow */}
      <path d="M74,148 L80,157 L86,148 L80,153 Z" fill="#034737" opacity="0.4" />
      {/* Neck skin */}
      <rect x="70" y="131" width="20" height="20" rx="2" fill="#f0c898" />
      {/* Hair back — messy */}
      <ellipse cx="80" cy="82" rx="47" ry="43" fill="#2c2010" />
      {/* Messy hairline */}
      <path d="M38,87 Q42,47 80,43 Q118,47 122,87 Q113,60 95,53 Q82,47 66,51 Q50,57 38,87 Z" fill="#2c2010" />
      {/* Messy strands sticking up */}
      <line x1="57" y1="43" x2="52" y2="34" stroke="#2c2010" strokeWidth="4" strokeLinecap="round" />
      <line x1="78" y1="42" x2="76" y2="32" stroke="#2c2010" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="100" y1="44" x2="105" y2="35" stroke="#2c2010" strokeWidth="4" strokeLinecap="round" />
      <line x1="68" y1="41" x2="65" y2="34" stroke="#2c2010" strokeWidth="3.5" strokeLinecap="round" />
      {/* Face */}
      <ellipse cx="80" cy="89" rx="44" ry="47" fill="#f0c898" />
      {/* Light stubble hint */}
      <ellipse cx="80" cy="112" rx="16" ry="8" fill="#2c2010" opacity="0.06" />
      {/* Cheek shadow */}
      <ellipse cx="55" cy="98" rx="9" ry="5" fill="#d09070" opacity="0.2" />
      <ellipse cx="105" cy="98" rx="9" ry="5" fill="#d09070" opacity="0.2" />
      {/* Eyebrows — slightly furrowed, tired */}
      <path d="M53,74 Q63,68 73,72" stroke="#2c2010" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M87,72 Q97,68 107,74" stroke="#2c2010" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      {/* Left eye — tired (narrower, heavy lid) */}
      <g style={blinkAnim}>
        <ellipse cx="63" cy="82" rx="7.5" ry="5.5" fill="white" />
        <ellipse cx="63" cy="82.5" rx="4.5" ry="4.5" fill="#1a0e0a" />
        <ellipse cx="61" cy="80.5" rx="1.8" ry="1.5" fill="white" opacity="0.5" />
        {/* Heavy upper eyelid covering top third */}
        <path d="M55.5,80 Q63,76.5 70.5,80" fill="#f0c898" />
      </g>
      {/* Right eye — tired */}
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="82" rx="7.5" ry="5.5" fill="white" />
        <ellipse cx="97" cy="82.5" rx="4.5" ry="4.5" fill="#1a0e0a" />
        <ellipse cx="95" cy="80.5" rx="1.8" ry="1.5" fill="white" opacity="0.5" />
        {/* Heavy upper eyelid */}
        <path d="M89.5,80 Q97,76.5 104.5,80" fill="#f0c898" />
      </g>
      {/* Nose */}
      <path d="M76,93 Q80,100 84,93" stroke="#c09870" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {/* Tired/flat mouth — slight downturn */}
      {speaking ? (
        <ellipse cx="80" cy="108" rx="9" ry="6.5" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <path d="M70,110 Q80,113 90,110" stroke="#b08070" strokeWidth="2.5" fill="none" strokeLinecap="round" />
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
