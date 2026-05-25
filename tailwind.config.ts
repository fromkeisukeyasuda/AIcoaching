import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "v2-blue": {
          DEFAULT: "#4A90E2",
          deep:    "#2D6CB8",
          lite:    "#E3F2FD",
        },
        "v2-coral": {
          DEFAULT: "#FF6B6B",
          lite:    "#FFE3E3",
        },
        "v2-green": {
          DEFAULT: "#6BCB77",
          lite:    "#E8F5E9",
          dark:    "#2D7A36",
        },
        "v2-orange": "#FFB347",
        "v2-bg":      "#F8F9FA",
        "v2-surface": "#FFFFFF",
        "v2-ink": {
          DEFAULT: "#2D3436",
          2:       "#5B6066",
          3:       "#9AA0A6",
        },
        "v2-border":      "#E5E7EB",
        "v2-border-soft": "#EEF1F4",
      },
      fontFamily: {
        round: [
          "M PLUS Rounded 1c",
          "Hiragino Maru Gothic ProN",
          "sans-serif",
        ],
        sans: [
          "Noto Sans JP",
          "Hiragino Sans",
          "Yu Gothic",
          "system-ui",
          "sans-serif",
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%":           { transform: "scale(1)",   opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
