import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-cormorant)", "var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "label": ["12px", { lineHeight: "1.2", letterSpacing: "0.2em" }],
        "label-sm": ["11px", { lineHeight: "1.2", letterSpacing: "0.15em" }],
      },
      colors: {
        white: "#FFFFFF",
        section: "#FBFBFB",
        gold: {
          light: "#e8dcc4",
          DEFAULT: "#B8860B",
          dark: "#9a7209",
        },
        champagne: {
          50: "#fdfbf7",
          100: "#f9f3e8",
          200: "#f0e4cc",
          300: "#e5d0a8",
          400: "#d4b87a",
          500: "#c4a05a",
        },
        noir: {
          900: "#0d0d0d",
          800: "#1a1a1a",
          700: "#2d2d2d",
          600: "#525252",
          500: "#737373",
          400: "#a3a3a3",
        },
      },
    },
  },
  plugins: [],
};

export default config;
