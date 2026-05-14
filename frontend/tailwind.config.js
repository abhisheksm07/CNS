/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "Rajdhani", "ui-sans-serif", "system-ui"],
        body: ["Inter", "Rajdhani", "ui-sans-serif", "system-ui"]
      },
      colors: {
        void: "#050712",
        panel: "rgba(9, 16, 35, 0.72)",
        cyanline: "#2ffcff",
        violetline: "#9a5cff",
        danger: "#ff315e",
        signal: "#ffd166"
      },
      boxShadow: {
        neon: "0 0 24px rgba(47,252,255,.34)",
        violet: "0 0 32px rgba(154,92,255,.28)",
        danger: "0 0 26px rgba(255,49,94,.35)"
      }
    }
  },
  plugins: []
};
