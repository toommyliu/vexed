import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "src/index.ts",
  format: "cjs",
  outDir: "./dist",
  dts: true,
  sourcemap: true,
});
