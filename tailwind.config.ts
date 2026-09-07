import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        perplexity: {
          dark: "#191A1A",
          darker: "#121313",
          card: "#202222",
          border: "#2E3030",
          teal: "#1fb8cd",
          tealHover: "#1898a9",
          muted: "#8A939B",
        }
      },
    },
  },
  plugins: [],
};
export default config;
