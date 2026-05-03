import { copyFile, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "esbuild";
import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist-demo");

const resolveUiSourcePlugin: Plugin = {
  name: "resolve-vexed-ui-source",
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@vexed\/ui$/ }, () => ({
      path: resolve(root, "src/index.ts"),
    }));

    buildApi.onResolve({ filter: /^@vexed\/ui\/styles\.css$/ }, () => ({
      path: resolve(root, "src/styles/styles.css"),
    }));
  },
};

async function main(): Promise<void> {
  await rm(dist, { force: true, recursive: true });
  await mkdir(dist, { recursive: true });

  await build({
    bundle: true,
    conditions: ["solid", "browser"],
    entryPoints: [resolve(root, "demo/App.tsx")],
    format: "esm",
    jsx: "automatic",
    jsxImportSource: "solid-js",
    outfile: resolve(dist, "app.js"),
    platform: "browser",
    plugins: [resolveUiSourcePlugin, solidPlugin()],
    sourcemap: true,
    target: "chrome87",
  });

  await copyFile(resolve(root, "demo/index.html"), resolve(dist, "index.html"));
}

await main();
