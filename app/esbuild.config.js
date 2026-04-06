const { build } = require("esbuild");
const { copyFileSync, mkdirSync } = require("fs");

const isProduction = process.env.NODE_ENV === "development";

async function transpile() {
  try {
    await build({
      entryPoints: ["./src/main/index.ts"],
      platform: "node",
      target: "chrome76",
      format: "cjs",
      minify: isProduction,
      sourcemap: !isProduction,
      outfile: "dist/main/index.js",
      logLevel: "info",
    });

    mkdirSync("dist/renderer/game", { recursive: true });
    copyFileSync(
      "src/renderer/game/index.html",
      "dist/renderer/game/index.html",
    );

    console.log("Build complete.");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

transpile();
