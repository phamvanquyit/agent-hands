import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/ui/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      src: resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.PORT || 18081}`,
        changeOrigin: true,
      },
      "/public": {
        target: `http://127.0.0.1:${process.env.PORT || 18081}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
