import { mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSync } from "esbuild";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, "..");
const MONOREPO_ROOT = resolve(ROOT_DIR, "../..");
const outfile = resolve(ROOT_DIR, "dist/effect.cjs");
const effectTypesDir = resolve(MONOREPO_ROOT, "node_modules/effect/dist");
const targetTypesDir = resolve(ROOT_DIR, "dist");

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
    absWorkingDir: MONOREPO_ROOT,
  });

  console.log(`[effect] bundled CJS build: ${outfile}`);

  // Copy type definitions
  const typeFiles = readdirSync(effectTypesDir).filter((f) => f.endsWith(".d.ts"));
  for (const file of typeFiles) {
    copyFileSync(resolve(effectTypesDir, file), resolve(targetTypesDir, file));
  }

  console.log(`[effect] copied ${typeFiles.length} type definition files`);
} catch (error) {
  console.error("[effect] failed to bundle effect@4 for CJS runtime");
  console.error(error);
  process.exit(1);
}
