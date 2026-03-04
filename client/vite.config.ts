import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.GITHUB_PAGES ? "/fate_online/" : "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@game": path.resolve(__dirname, "../server/game"),
      "@server-shared": path.resolve(__dirname, "../server/shared"),
    },
  },
  server: {
    port: 5173,
    fs: { allow: [".", "../server"] },
    proxy: {
      "/api": "http://localhost:3000",
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
      },
    },
  },
});
