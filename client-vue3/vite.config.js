import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import mkcert from "vite-plugin-mkcert";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ command }) => ({
  // Production assets are served by the backend under /_client.
  // Keep dev base at / for the standalone Vite HTTPS server.
  base: command === "build" ? "/_client/" : "/",
  plugins: [vue(), cssInjectedByJsPlugin(), mkcert()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/styles/mixins.scss" as *;
        `,
        api: "modern-compiler",
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@node_modules": fileURLToPath(
        new URL("./node_modules", import.meta.url)
      ),
    },
  },
  server: {
    https: true,
    port: 5178,
    host: true,
    origin: undefined,
    cors: {
      origin: "*",
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: "./src/main.js",
      output: {
        format: "es",
        entryFileNames: "build.js",
      },
    },
  },
}));
