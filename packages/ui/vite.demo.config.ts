import { resolve } from "node:path";
import solid from "vite-plugin-solid";
import { defineConfig } from "vite";

const root = resolve(import.meta.dirname, "demo");
const packageRoot = import.meta.dirname;

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: resolve(packageRoot, "dist-demo"),
    sourcemap: true,
    target: "chrome87",
  },
  cacheDir: resolve(packageRoot, "node_modules/.vite-demo"),
  esbuild: {
    target: "chrome87",
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "chrome87",
    },
  },
  plugins: [solid()],
  resolve: {
    alias: [
      {
        find: "@vexed/ui/styles.css",
        replacement: resolve(packageRoot, "src/styles/styles.css"),
      },
      {
        find: "@vexed/ui",
        replacement: resolve(packageRoot, "src/index.ts"),
      },
    ],
  },
  root,
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: false,
  },
});
