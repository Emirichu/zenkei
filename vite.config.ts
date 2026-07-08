import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Zenkei is a fully static, client-side app: no backend, no env vars,
// no server-side anything. The build output in dist/ can be hosted on
// any static file server. base "./" keeps asset URLs relative so the
// same build works at a domain root (Vercel) and under a subpath
// (GitHub Pages at /zenkei/).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
