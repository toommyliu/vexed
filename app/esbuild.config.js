const { build, context } = require("esbuild");
const postcss = require("esbuild-postcss");
const {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  unwatchFile,
  watchFile,
} = require("fs");
const { dirname } = require("path");
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
const electronExternals = ["electron", "nw-flash-trust"];
const devBuildNotifyPath = process.env.VEXED_DEV_BUILD_NOTIFY;
const skipInitialDevBuildNotify =
  process.env.VEXED_DEV_BUILD_NOTIFY_SKIP_INITIAL === "1";

function notifyDevBuild(label) {
  if (!devBuildNotifyPath) {
    return;
  }

  mkdirSync(dirname(devBuildNotifyPath), { recursive: true });
  appendFileSync(
    devBuildNotifyPath,
    `${JSON.stringify({
      label,
      pid: process.pid,
      time: Date.now(),
    })}\n`,
  );
}

function createDevBuildNotifyPlugin(label) {
  let skippedInitialNotify = false;

  return {
    name: `vexed-dev-build-notify:${label}`,
    setup(build) {
      build.onEnd((result) => {
        if (result.errors.length > 0) {
          return;
        }

        if (skipInitialDevBuildNotify && !skippedInitialNotify) {
          skippedInitialNotify = true;
          return;
        }

        notifyDevBuild(label);
      });
    },
  };
}

function createMainBuildOptions() {
  return {
    ...base,
    entryPoints: ["./src/main/index.ts"],
    bundle: true,
    external: electronExternals,
    platform: "node",
    target: "chrome76",
    format: "cjs",
    outfile: "dist/main/index.js",
    plugins: [createDevBuildNotifyPlugin("main")],
  };
}

function createPreloadBuildOptions() {
  return {
    ...base,
    entryPoints: ["./src/preload/index.ts"],
    bundle: true,
    external: ["electron"],
    platform: "node",
    target: "chrome76",
    format: "cjs",
    outfile: "dist/preload/index.js",
    plugins: [createDevBuildNotifyPlugin("preload")],
  };
}

function createRendererBuildOptions() {
  return {
    ...base,
    entryPoints: ["./src/renderer/game/index.tsx"],
    bundle: true,
    platform: "browser",
    target: "chrome87",
    conditions: ["solid", "browser"],
    outdir: rendererHtmlOutDir,
    plugins: [
      solidPlugin(),
      postcss(),
      createDevBuildNotifyPlugin("renderer"),
    ],
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development",
      ),
    },
    external: ["electron"],
  };
}

function copyRendererHtml({ notify = false } = {}) {
  mkdirSync(rendererHtmlOutDir, { recursive: true });
  copyFileSync(rendererHtmlSource, rendererHtmlTarget);
  if (notify) {
    notifyDevBuild("renderer-html");
  }
}

async function buildOnce() {
  await build(createMainBuildOptions());
  await build(createPreloadBuildOptions());
  copyRendererHtml();
  await build(createRendererBuildOptions());
  console.log("Build complete.");
}

async function watchBuild() {
  const mainContext = await context(createMainBuildOptions());
  const preloadContext = await context(createPreloadBuildOptions());
  const rendererContext = await context(createRendererBuildOptions());

  copyRendererHtml();

  await Promise.all([
    mainContext.watch({ delay: 100 }),
    preloadContext.watch({ delay: 100 }),
    rendererContext.watch({ delay: 100 }),
  ]);

  const syncRendererHtml = () => {
    try {
      copyRendererHtml({ notify: true });
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

    await Promise.allSettled([
      mainContext.dispose(),
      preloadContext.dispose(),
      rendererContext.dispose(),
    ]);
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
