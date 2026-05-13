import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        matrix: {
          ink: "#07020f",
          panel: "#12051f",
          glass: "rgba(20, 8, 38, 0.72)",
          pink: "#ff2ebd",
          cyan: "#16f5ff",
          purple: "#8b5cf6",
          violet: "#4c1d95",
          lime: "#a3ff12"
        }
      },
      boxShadow: {
        neon: "0 0 22px rgba(255, 46, 189, 0.35), 0 0 44px rgba(22, 245, 255, 0.18)",
        cyan: "0 0 24px rgba(22, 245, 255, 0.25)",
        pink: "0 0 26px rgba(255, 46, 189, 0.30)"
      },
      backgroundImage: {
        "matrix-radial":
          "radial-gradient(circle at 20% 10%, rgba(255,46,189,0.22), transparent 28%), radial-gradient(circle at 80% 20%, rgba(22,245,255,0.16), transparent 24%), linear-gradient(135deg, #07020f 0%, #12051f 45%, #21083d 100%)",
        "grid-lines":
          "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)"
      },
      fontFamily: {
        display: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
