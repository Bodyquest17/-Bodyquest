import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#10151C",
        surface: "#202936",
        accent: "#B7F34B",
        muted: "#9CA3AF",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        xpPop: {
          "0%": { transform: "translateY(8px) scale(.9)", opacity: "0" },
          "40%": { transform: "translateY(-4px) scale(1.08)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: { xpPop: "xpPop .5s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
