import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17201d",
        sage: "#dce9de",
        moss: "#2f5d50",
        cream: "#fbfaf7",
        coral: "#e67c5f",
      },
      boxShadow: {
        card: "0 12px 40px rgba(37, 62, 53, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;