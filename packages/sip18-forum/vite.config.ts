import { fileURLToPath, URL } from "node:url";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      "@bigmarket/bm-common": fileURLToPath(
        new URL("../../packages/bm-common/src/index.ts", import.meta.url),
      ),
      "@bigmarket/bm-types": fileURLToPath(
        new URL("../../packages/bm-helpers/src/index.ts", import.meta.url),
      ),
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
      },
    },
  },
});
