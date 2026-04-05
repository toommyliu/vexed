import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { buildSync } from "esbuild";

const ROOT_DIR = process.cwd();
const outfile = resolve(ROOT_DIR, "dist/vendor/effect.cjs");

try {
  mkdirSync(dirname(outfile), { recursive: true });

  buildSync({
    entryPoints: ["effect"],
    outfile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node12",
    sourcemap: false,
    minify: false,
    logLevel: "silent",
  });

  console.log(`[effect] bundled CJS build: ${outfile}`);
} catch (error) {
  console.error("[effect] failed to bundle effect@4 for CJS runtime");
  console.error(error);
  process.exit(1);
}
