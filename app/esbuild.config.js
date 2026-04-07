const { build } = require("esbuild");
const { copyFileSync, mkdirSync } = require("fs");
const { solidPlugin } = require("esbuild-plugin-solid");

const isProduction = process.env.NODE_ENV === "production";

const base = {
  minify: isProduction,
  sourcemap: !isProduction,
  logLevel: "info",
};

async function transpile() {
  try {
    await build({
      ...base,
      entryPoints: ["./src/main/index.ts"],
      platform: "node",
      target: "chrome76",
      format: "cjs",
      outfile: "dist/main/index.js",
    });

    mkdirSync("dist/renderer/game", { recursive: true });
    copyFileSync(
      "src/renderer/game/index.html",
      "dist/renderer/game/index.html",
    );

    await build({
      ...base,
      entryPoints: [
        "./src/renderer/game/**/*.tsx",
        "./src/renderer/game/**/*.ts",
      ],
      bundle: true,
      platform: "browser",
      conditions: ["browser"],
      outdir: "dist/renderer/game",
      plugins: [solidPlugin()],
      define: {
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV || "development",
        ),
      },
      external: ["electron"],
    });

    console.log("Build complete.");
  } catch (err) {
    console.error("Build failed:", err);
    process.exit(1);
  }
}

transpile();