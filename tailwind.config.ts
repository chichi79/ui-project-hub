import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdf6",
          100: "#dcfceb",
          200: "#bbf7d7",
          300: "#86efbd",
          400: "#4ade94",
          500: "#22c574",
          600: "#16a35f",
          700: "#15804d",
          800: "#16653f",
          900: "#145335",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        body: ["15px", { lineHeight: "1.75", letterSpacing: "-0.01em" }],
        caption: ["12px", { lineHeight: "1.5", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        tightish: "-0.02em",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(22,163,95,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
