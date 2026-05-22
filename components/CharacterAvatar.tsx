"use client";

import React from "react";

interface CharacterAvatarProps {
  clientName: string;
  speaking: boolean;
  loading?: boolean;
  emotion?: string;   // idle | neutral | happy | smile | worried | sad | surprised | serious | angry | smirk | warm
  size?: "md" | "lg" | "xl"; // md = 148px (default), lg = 240px, xl = 400px
}

/* ── SVG animation styles — DefaultCharacter のみ使用 ── */
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

/* ── Emotion → image path mappings ── */
const EMOTION_MAPS: Record<string, Record<string, string>> = {
  tanaka: {
    idle:      "/characters/tanaka.png",
    neutral:   "/characters/tanaka_neutral.png",
    happy:     "/characters/tanaka_happy.png",
    smile:     "/characters/tanaka_smile.png",
    worried:   "/characters/tanaka_worried.png",
    sad:       "/characters/tanaka_sad.png",
    surprised: "/characters/tanaka_surprised.png",
    serious:   "/characters/tanaka_serious.png",
    angry:     "/characters/tanaka_serious.png",  // fallback to serious
  },
  sato: {
    idle:      "/characters/sato.png",
    neutral:   "/characters/sato_neutral.png",
    happy:     "/characters/sato_happy.png",
    smile:     "/characters/sato_smile.png",
    worried:   "/characters/sato_worried.png",
    sad:       "/characters/sato_sad.png",
    surprised: "/characters/sato_surprised.png",
    angry:     "/characters/sato_angry.png",
    serious:   "/characters/sato_neutral.png",
  },
  suzuki: {
    idle:      "/characters/suzuki.png",
    neutral:   "/characters/suzuki.png",
    happy:     "/characters/suzuki_happy.png",
    smile:     "/characters/suzuki_smile.png",
    worried:   "/characters/suzuki_sad.png",   // no worried → sad
    sad:       "/characters/suzuki_sad.png",
    surprised: "/characters/suzuki_surprised.png",
    angry:     "/characters/suzuki_angry.png",
    serious:   "/characters/suzuki.png",
    smirk:     "/characters/suzuki_smirk.png",
    warm:      "/characters/suzuki_warm.png",
  },
};

/* ── Portrait character with emotion-driven expression ──────────────────────
   emotion prop を受け取り EMOTION_MAPS で画像を決定。
   表情が変わるとき 220ms フェードアウト → 新画像フェードイン。
   サイクルアニメーションは廃止。speaking は border glow のみで表現。
──────────────────────────────────────────────────────────────────────────── */
function CharacterImage({
  charType,
  emotion = "idle",
  alt,
  speaking,
  size = "md",
}: {
  charType: string;
  emotion?: string;
  alt: string;
  speaking: boolean;
  size?: "md" | "lg" | "xl";
}) {
  const dim    = size === "xl" ? 400 : size === "lg" ? 240 : 148;
  const radius = size === "xl" ? 24  : size === "lg" ? 18  : 14;

  const map       = EMOTION_MAPS[charType] ?? {};
  const targetSrc = map[emotion] ?? map["idle"] ?? `/characters/${charType}.png`;

  /* フェードトランジション */
  const [displaySrc, setDisplaySrc] = React.useState(targetSrc);
  const [fading,     setFading]     = React.useState(false);

  React.useEffect(() => {
    if (targetSrc === displaySrc) return;
    setFading(true);
    const t = setTimeout(() => {
      setDisplaySrc(targetSrc);
      setFading(false);
    }, 220);
    return () => clearTimeout(t);
  }, [targetSrc, displaySrc]);

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: radius,
        overflow: "hidden",
        background: "#f0ece4",
        flexShrink: 0,
        position: "relative",
        boxShadow: speaking
          ? "0 0 0 2px rgba(99,102,241,0.55), 0 8px 32px rgba(0,0,0,0.5)"
          : "0 4px 20px rgba(0,0,0,0.35)",
        transition: "box-shadow 0.4s ease",
      }}
    >
      <img
        src={displaySrc}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
          opacity: fading ? 0 : 1,
          transition: "opacity 0.22s ease",
        }}
      />
    </div>
  );
}

/* ── Default SVG character (名前が不明なシナリオ用) ── */
function DefaultCharacter({ speaking }: { speaking: boolean }) {
  return (
    <svg viewBox="0 0 160 200" width="140" height="175" xmlns="http://www.w3.org/2000/svg">
      <rect x="70" y="134" width="20" height="18" rx="2" fill="#e0a880" />
      <path d="M22,168 Q38,150 68,148 L72,160 L80,170 L88,160 L92,148 Q122,150 138,168 L138,200 L22,200 Z" fill="#3730a3" />
      <path d="M74,148 L77,162 L80,170 L83,162 L86,148 L80,155 Z" fill="#4338ca" opacity="0.5" />
      <rect x="70" y="131" width="20" height="20" rx="2" fill="#f5c4a0" />
      <ellipse cx="80" cy="81" rx="47" ry="44" fill="#374151" />
      <path d="M36,85 Q43,44 80,41 Q117,44 124,85 Q110,57 80,55 Q50,57 36,85 Z" fill="#374151" />
      <ellipse cx="80" cy="89" rx="44" ry="47" fill="#f5c4a0" />
      <ellipse cx="55" cy="97" rx="9" ry="5" fill="#f0a88a" opacity="0.2" />
      <ellipse cx="105" cy="97" rx="9" ry="5" fill="#f0a88a" opacity="0.2" />
      <path d="M54,71 Q63,65 73,69" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M87,69 Q97,65 106,71" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g style={blinkAnim}>
        <ellipse cx="63" cy="80" rx="8" ry="7" fill="white" />
        <ellipse cx="63" cy="80" rx="5.5" ry="5.5" fill="#1a1a2e" />
        <ellipse cx="61" cy="78" rx="2" ry="1.5" fill="white" opacity="0.6" />
      </g>
      <g style={blinkAnimDelay}>
        <ellipse cx="97" cy="80" rx="8" ry="7" fill="white" />
        <ellipse cx="97" cy="80" rx="5.5" ry="5.5" fill="#1a1a2e" />
        <ellipse cx="95" cy="78" rx="2" ry="1.5" fill="white" opacity="0.6" />
      </g>
      <path d="M76,93 Q80,99 84,93" stroke="#c09880" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
      {speaking ? (
        <ellipse cx="80" cy="107" rx="10" ry="7" fill="#2a0a0a" style={speakAnim} />
      ) : (
        <path d="M70,105 Q80,114 90,105" stroke="#c08878" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

/* ── Main export ── */
export default function CharacterAvatar({
  clientName,
  speaking,
  loading = false,
  emotion = "idle",
  size = "md",
}: CharacterAvatarProps) {
  const charType = clientName.includes("田中")
    ? "tanaka"
    : clientName.includes("佐藤")
    ? "sato"
    : clientName.includes("鈴木")
    ? "suzuki"
    : "default";

  const isImage = charType !== "default";

  /* コンテナ・リングサイズ */
  const containerDim = size === "xl" ? 440 : size === "lg" ? 280 : 200;
  const containerH   = size === "xl" ? 440 : size === "lg" ? 280 : 195;
  const ring1        = size === "xl" ? 428 : size === "lg" ? 268 : 175;
  const ring2        = size === "xl" ? 408 : size === "lg" ? 250 : 148;
  const spinnerDim   = size === "xl" ? 412 : size === "lg" ? 252 : 158;

  /* DefaultCharacter 用フロートアニメーション */
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
      style={{ width: containerDim, height: containerH }}
    >
      {/* Speaking pulse rings */}
      {speaking && (
        <>
          <div
            className="absolute rounded-full border border-indigo-400/15"
            style={{
              width: ring1, height: ring1,
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div
            className="absolute rounded-full border border-indigo-400/20"
            style={{
              width: ring2, height: ring2,
              top: "50%", left: "50%",
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
            width: spinnerDim, height: spinnerDim,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid transparent",
            borderTopColor: "rgba(99,102,241,0.6)",
            animation: "spin 1s linear infinite",
          }}
        />
      )}

      {/* Character */}
      <div style={isImage ? { display: "block" } : floatStyle}>
        {isImage ? (
          <CharacterImage
            charType={charType}
            emotion={emotion}
            alt={clientName}
            speaking={speaking}
            size={size}
          />
        ) : (
          <DefaultCharacter speaking={speaking} />
        )}
      </div>
    </div>
  );
}
