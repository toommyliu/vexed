const { build, context } = require("esbuild");
const { copyFileSync, mkdirSync, unwatchFile, watchFile } = require("fs");
const { solidPlugin } = require("esbuild-plugin-solid");

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

const base = {
  minify: isProduction,
  sourcemap: !isProduction,
  logLevel: "info",
};

const rendererHtmlSource = "src/renderer/game/index.html";
const rendererHtmlOutDir = "dist/renderer/game";
const rendererHtmlTarget = `${rendererHtmlOutDir}/index.html`;

function createMainBuildOptions() {
  return {
    ...base,
    entryPoints: ["./src/main/index.ts"],
    platform: "node",
    target: "chrome76",
    format: "cjs",
    outfile: "dist/main/index.js",
  };
}

function createRendererBuildOptions() {
  return {
    ...base,
    entryPoints: ["./src/renderer/game/index.tsx"],
    bundle: true,
    platform: "browser",
    conditions: ["browser"],
    outdir: rendererHtmlOutDir,
    plugins: [solidPlugin()],
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development",
      ),
    },
    external: ["electron"],
  };
}

function copyRendererHtml() {
  mkdirSync(rendererHtmlOutDir, { recursive: true });
  copyFileSync(rendererHtmlSource, rendererHtmlTarget);
}

async function buildOnce() {
  await build(createMainBuildOptions());
  copyRendererHtml();
  await build(createRendererBuildOptions());
  console.log("Build complete.");
}

async function watchBuild() {
  const mainContext = await context(createMainBuildOptions());
  const rendererContext = await context(createRendererBuildOptions());

  copyRendererHtml();

  await Promise.all([
    mainContext.watch({ delay: 100 }),
    rendererContext.watch({ delay: 100 }),
  ]);

  const syncRendererHtml = () => {
    try {
      copyRendererHtml();
      console.log("Copied renderer HTML.");
    } catch (error) {
      console.error("Failed to copy renderer HTML:", error);
    }
  };

  watchFile(rendererHtmlSource, { interval: 250 }, syncRendererHtml);

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    unwatchFile(rendererHtmlSource);

    await Promise.allSettled([mainContext.dispose(), rendererContext.dispose()]);
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  console.log("Watching for changes...");
}

async function main() {
  try {
    if (isWatch) {
      await watchBuild();
      return;
    }

    await buildOnce();
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

main();
