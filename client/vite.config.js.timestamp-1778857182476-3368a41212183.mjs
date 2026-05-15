// vite.config.js
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/node_modules/vite/dist/node/index.js";
import vue2 from "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/node_modules/@vitejs/plugin-vue2/dist/index.mjs";
import cssInjectedByJsPlugin from "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/node_modules/vite-plugin-css-injected-by-js/dist/esm/index.js";
import mkcert from "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/node_modules/vite-plugin-mkcert/dist/mkcert.mjs";
import vueJsx from "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/node_modules/@vitejs/plugin-vue2-jsx/dist/index.mjs";
import { visualizer } from "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_import_meta_url = "file:///Users/louis/Documents/REPO/2026-SOFTGEMS/client/vite.config.js";
var vite_config_default = defineConfig({
  plugins: [vue2(), cssInjectedByJsPlugin(), mkcert(), vueJsx()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "@/utils/mixins.scss" as *;
        `,
        api: "modern-compiler"
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      "@node_modules": fileURLToPath(
        new URL("./node_modules", __vite_injected_original_import_meta_url)
      )
    }
  },
  assetsInclude: ["**/*.svg"],
  server: {
    https: true,
    port: 5178,
    host: true,
    origin: void 0,
    cors: {
      origin: "*"
    }
  },
  build: {
    modulePreload: false,
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      input: "./src/main.js",
      output: [
        {
          format: "iife",
          entryFileNames: "bundle.js",
          globals: {
            vue: "Vue",
            "vue-router": "VueRouter"
          }
        },
        {
          format: "es",
          entryFileNames: "build.js",
          plugins: [visualizer({ filename: "stats.html", open: true })]
        }
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvbG91aXMvRG9jdW1lbnRzL1JFUE8vMjAyNi1TT0ZUR0VNUy9jbGllbnRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9sb3Vpcy9Eb2N1bWVudHMvUkVQTy8yMDI2LVNPRlRHRU1TL2NsaWVudC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvbG91aXMvRG9jdW1lbnRzL1JFUE8vMjAyNi1TT0ZUR0VNUy9jbGllbnQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tIFwibm9kZTp1cmxcIjtcblxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCB2dWUyIGZyb20gXCJAdml0ZWpzL3BsdWdpbi12dWUyXCI7XG5pbXBvcnQgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1jc3MtaW5qZWN0ZWQtYnktanNcIjtcbmltcG9ydCBta2NlcnQgZnJvbSBcInZpdGUtcGx1Z2luLW1rY2VydFwiO1xuaW1wb3J0IHZ1ZUpzeCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlMi1qc3hcIjtcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCI7XG5cbi8vIGh0dHBzOi8vdml0ZS5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3Z1ZTIoKSwgY3NzSW5qZWN0ZWRCeUpzUGx1Z2luKCksIG1rY2VydCgpLCB2dWVKc3goKV0sXG4gIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgYWRkaXRpb25hbERhdGE6IGBcbiAgICAgICAgICBAdXNlIFwiQC91dGlscy9taXhpbnMuc2Nzc1wiIGFzICo7XG4gICAgICAgIGAsXG4gICAgICAgIGFwaTogXCJtb2Rlcm4tY29tcGlsZXJcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogZmlsZVVSTFRvUGF0aChuZXcgVVJMKFwiLi9zcmNcIiwgaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICBcIkBub2RlX21vZHVsZXNcIjogZmlsZVVSTFRvUGF0aChcbiAgICAgICAgbmV3IFVSTChcIi4vbm9kZV9tb2R1bGVzXCIsIGltcG9ydC5tZXRhLnVybClcbiAgICAgICksXG4gICAgfSxcbiAgfSxcbiAgYXNzZXRzSW5jbHVkZTogW1wiKiovKi5zdmdcIl0sXG4gIHNlcnZlcjoge1xuICAgIGh0dHBzOiB0cnVlLFxuICAgIHBvcnQ6IDUxNzgsXG4gICAgaG9zdDogdHJ1ZSxcbiAgICBvcmlnaW46IHVuZGVmaW5lZCxcbiAgICBjb3JzOiB7XG4gICAgICBvcmlnaW46IFwiKlwiLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgbW9kdWxlUHJlbG9hZDogZmFsc2UsXG4gICAgb3V0RGlyOiBcImRpc3RcIixcbiAgICBhc3NldHNEaXI6IFwiYXNzZXRzXCIsXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgaW5wdXQ6IFwiLi9zcmMvbWFpbi5qc1wiLFxuICAgICAgb3V0cHV0OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBmb3JtYXQ6IFwiaWlmZVwiLFxuICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcImJ1bmRsZS5qc1wiLFxuICAgICAgICAgIGdsb2JhbHM6IHtcbiAgICAgICAgICAgIHZ1ZTogXCJWdWVcIixcbiAgICAgICAgICAgIFwidnVlLXJvdXRlclwiOiBcIlZ1ZVJvdXRlclwiLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBmb3JtYXQ6IFwiZXNcIixcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJidWlsZC5qc1wiLFxuICAgICAgICAgIHBsdWdpbnM6IFt2aXN1YWxpemVyKHsgZmlsZW5hbWU6IFwic3RhdHMuaHRtbFwiLCBvcGVuOiB0cnVlIH0pXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFrVSxTQUFTLGVBQWUsV0FBVztBQUVyVyxTQUFTLG9CQUFvQjtBQUM3QixPQUFPLFVBQVU7QUFDakIsT0FBTywyQkFBMkI7QUFDbEMsT0FBTyxZQUFZO0FBQ25CLE9BQU8sWUFBWTtBQUNuQixTQUFTLGtCQUFrQjtBQVA2SyxJQUFNLDJDQUEyQztBQVV6UCxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsS0FBSyxHQUFHLHNCQUFzQixHQUFHLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFBQSxFQUM3RCxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUEsUUFDSixnQkFBZ0I7QUFBQTtBQUFBO0FBQUEsUUFHaEIsS0FBSztBQUFBLE1BQ1A7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxNQUNwRCxpQkFBaUI7QUFBQSxRQUNmLElBQUksSUFBSSxrQkFBa0Isd0NBQWU7QUFBQSxNQUMzQztBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxlQUFlLENBQUMsVUFBVTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxJQUNSLE1BQU07QUFBQSxNQUNKLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLElBQ2YsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLE1BQ1AsUUFBUTtBQUFBLFFBQ047QUFBQSxVQUNFLFFBQVE7QUFBQSxVQUNSLGdCQUFnQjtBQUFBLFVBQ2hCLFNBQVM7QUFBQSxZQUNQLEtBQUs7QUFBQSxZQUNMLGNBQWM7QUFBQSxVQUNoQjtBQUFBLFFBQ0Y7QUFBQSxRQUNBO0FBQUEsVUFDRSxRQUFRO0FBQUEsVUFDUixnQkFBZ0I7QUFBQSxVQUNoQixTQUFTLENBQUMsV0FBVyxFQUFFLFVBQVUsY0FBYyxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQUEsUUFDOUQ7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
