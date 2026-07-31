import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base:'./' -> works on Vercel, Netlify, and static subpaths alike
export default defineConfig({
  plugins: [react()],
  base: "./",
});
