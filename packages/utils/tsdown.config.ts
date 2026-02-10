import { defineConfig } from "tsdown";

export default defineConfig({
  entry: "./src/**/*.ts",
  format: "cjs",
  outDir: "./dist",
  minify: true,
  dts: true,
  exports: true,
});
