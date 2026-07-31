/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16181C",
        panel: "#1E2127",
        panel2: "#262A31",
        line: "#33383F",
        muted: "#9098A1",
        amber: "#F5B417",
        good: "#4ADE80",
        bad: "#F1616B",
        sky: "#4C9AE6",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
