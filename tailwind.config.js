/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "Rajdhani", "sans-serif"],
        body: ["Rajdhani", "Noto Sans Bengali", "sans-serif"],
      },
      colors: {
        matrix: {
          black: "#050006",
          panel: "rgba(16, 4, 22, 0.72)",
          red: "#ff173f",
          blue: "#00e7ff",
          purple: "#9a35ff",
          gold: "#ffd166",
        },
      },
      boxShadow: {
        neon: "0 0 18px rgba(255,23,63,.58), 0 0 42px rgba(154,53,255,.25)",
        blue: "0 0 22px rgba(0,231,255,.45)",
        gold: "0 0 22px rgba(255,209,102,.45)",
      },
      backgroundImage: {
        cyber:
          "radial-gradient(circle at 15% 15%, rgba(255,23,63,.24), transparent 28%), radial-gradient(circle at 82% 20%, rgba(0,231,255,.18), transparent 28%), linear-gradient(135deg, #050006 0%, #130614 48%, #050006 100%)",
      },
    },
  },
  plugins: [],
};
