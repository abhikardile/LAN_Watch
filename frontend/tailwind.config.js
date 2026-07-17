/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0B0F14",
          panel: "#11161D",
          raised: "#161C25",
          border: "#232B36",
        },
        ink: {
          DEFAULT: "#E6EDF3",
          dim: "#8B96A5",
          faint: "#5B6472",
        },
        signal: {
          up: "#3FD97F",
          upDim: "#1E5C3B",
          down: "#F85149",
          downDim: "#5C2422",
          pending: "#E3B341",
        },
        wire: "#2F80ED",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 0 0 1px rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.35)",
      },
      keyframes: {
        pulse_ring: {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 2.2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
      },
    },
  },
  plugins: [],
};
