const { build, context } = require("esbuild");
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

const solidRendererTargets = [
  {
    name: "game",
    entryPoint: "./src/renderer/windows/game/App.tsx",
    html: "src/renderer/windows/game/index.html",
  },
  {
    name: "account-manager",
    entryPoint: "./src/renderer/windows/account-manager/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "settings",
    entryPoint: "./src/renderer/windows/settings/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "environment",
    entryPoint: "./src/renderer/windows/environment/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "skills",
    entryPoint: "./src/renderer/windows/skills/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "fast-travels",
    entryPoint: "./src/renderer/windows/fast-travels/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "loader-grabber",
    entryPoint: "./src/renderer/windows/loader-grabber/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "follower",
    entryPoint: "./src/renderer/windows/follower/App.tsx",
    html: "src/renderer/windows/index.html",
  },
  {
    name: "packets",
    entryPoint: "./src/renderer/windows/packets/App.tsx",
    html: "src/renderer/windows/index.html",
  },
];
const rendererEntryPoints = Object.fromEntries(
  solidRendererTargets.map((target) => [
    `${target.name}/index`,
    target.entryPoint,
  ]),
);
const rendererHtmlFiles = solidRendererTargets.map((target) => ({
  source: target.html,
  outDir: `dist/renderer/${target.name}`,
  target: `dist/renderer/${target.name}/index.html`,
}));
const rendererHtmlSources = [
  ...new Set(rendererHtmlFiles.map((file) => file.source)),
];
const electronExternals = ["electron"];
const devBuildNotifyPath = process.env.VEXED_DEV_BUILD_NOTIFY;
const skipInitialDevBuildNotify =
  process.env.VEXED_DEV_BUILD_NOTIFY_SKIP_INITIAL === "1";
const devRunnerPid = parseProcessId(process.env.VEXED_DEV_RUNNER_PID);
const DEV_BUILD_NOTIFY_DEBOUNCE_MS = 150;
const WATCH_PARENT_POLL_MS = 1000;
const WATCH_FORCE_EXIT_MS = 2500;
const pendingDevBuildLabels = new Set();
// Watch mode uses separate esbuild contexts; notify the runner only after the
// active context batch has settled so it does not restart on partial output.
let activeDevBuilds = 0;
let devBuildHadError = false;
let devBuildNotifyTimer;

function parseProcessId(value) {
  if (value === undefined) {
    return undefined;
  }

  const pid = Number(value);
  return Number.isInteger(pid) && pid > 0 ? pid : undefined;
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function selectDevBuildNotifyLabel(labels) {
  if (labels.includes("main")) {
    return "main";
  }

  if (labels.includes("preload")) {
    return "preload";
  }

  if (
    labels.length > 0 &&
    labels.every((label) => label === "renderer" || label === "renderer-html")
  ) {
    return "renderer";
  }

  return "unknown";
}

function flushDevBuildNotify() {
  if (!devBuildNotifyPath) {
    return;
  }

  if (devBuildNotifyTimer) {
    clearTimeout(devBuildNotifyTimer);
    devBuildNotifyTimer = undefined;
  }

  if (activeDevBuilds > 0) {
    return;
  }

  if (pendingDevBuildLabels.size === 0) {
    return;
  }

  const labels = [...pendingDevBuildLabels];
  pendingDevBuildLabels.clear();

  mkdirSync(dirname(devBuildNotifyPath), { recursive: true });
  appendFileSync(
    devBuildNotifyPath,
    `${JSON.stringify({
      label: selectDevBuildNotifyLabel(labels),
      labels,
      pid: process.pid,
      time: Date.now(),
    })}\n`,
  );
}

function scheduleDevBuildNotifyFlush() {
  if (!devBuildNotifyPath) {
    return;
  }

  if (activeDevBuilds > 0 || pendingDevBuildLabels.size === 0) {
    return;
  }

  if (devBuildNotifyTimer) {
    clearTimeout(devBuildNotifyTimer);
  }

  devBuildNotifyTimer = setTimeout(
    flushDevBuildNotify,
    DEV_BUILD_NOTIFY_DEBOUNCE_MS,
  );
}

function queueDevBuildNotify(label) {
  if (!devBuildNotifyPath) {
    return;
  }

  pendingDevBuildLabels.add(label);
  scheduleDevBuildNotifyFlush();
}

function markDevBuildStarted() {
  if (!devBuildNotifyPath) {
    return;
  }

  activeDevBuilds += 1;
  if (devBuildNotifyTimer) {
    clearTimeout(devBuildNotifyTimer);
    devBuildNotifyTimer = undefined;
  }
}

function markDevBuildFinished(result) {
  if (!devBuildNotifyPath) {
    return;
  }

  if (result.errors.length > 0) {
    devBuildHadError = true;
  }

  activeDevBuilds = Math.max(0, activeDevBuilds - 1);

  if (activeDevBuilds > 0) {
    return;
  }

  if (devBuildHadError) {
    pendingDevBuildLabels.clear();
    devBuildHadError = false;
    return;
  }

  scheduleDevBuildNotifyFlush();
}

function createDevBuildNotifyPlugin(label) {
  let skippedInitialNotify = false;

  return {
    name: `vexed-dev-build-notify:${label}`,
    setup(build) {
      build.onStart(() => {
        markDevBuildStarted();
      });

      build.onEnd((result) => {
        if (result.errors.length === 0) {
          if (skipInitialDevBuildNotify && !skippedInitialNotify) {
            skippedInitialNotify = true;
          } else {
            queueDevBuildNotify(label);
          }
        }

        markDevBuildFinished(result);
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
    entryPoints: ["./src/main/preload.ts"],
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
    entryPoints: rendererEntryPoints,
    bundle: true,
    platform: "browser",
    target: "chrome87",
    conditions: ["solid", "browser"],
    outdir: "dist/renderer",
    entryNames: "[dir]/[name]",
    assetNames: "assets/[name]-[hash]",
    loader: {
      ".woff2": "file",
    },
    plugins: [solidPlugin(), createDevBuildNotifyPlugin("renderer")],
    define: {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development",
      ),
    },
    external: ["electron"],
  };
}

function copyRendererHtml({ notify = false } = {}) {
  for (const file of rendererHtmlFiles) {
    mkdirSync(file.outDir, { recursive: true });
    copyFileSync(file.source, file.target);
  }

  if (notify) {
    queueDevBuildNotify("renderer-html");
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
  const parentPid = process.ppid;
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

  for (const source of rendererHtmlSources) {
    watchFile(source, { interval: 250 }, syncRendererHtml);
  }

  let shuttingDown = false;
  let parentPollTimer;
  const shutdown = async (reason = "signal", exitCode = 0) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    if (parentPollTimer) {
      clearInterval(parentPollTimer);
      parentPollTimer = undefined;
    }
    for (const source of rendererHtmlSources) {
      unwatchFile(source);
    }
    flushDevBuildNotify();

    const forceExitTimer = setTimeout(() => {
      console.error(`[watch] forced exit after ${reason} shutdown timed out.`);
      process.exit(exitCode === 0 ? 1 : exitCode);
    }, WATCH_FORCE_EXIT_MS);
    forceExitTimer.unref?.();

    await Promise.allSettled([
      mainContext.dispose(),
      preloadContext.dispose(),
      rendererContext.dispose(),
    ]);
    clearTimeout(forceExitTimer);
    process.exit(exitCode);
  };

  parentPollTimer = setInterval(() => {
    if (devRunnerPid !== undefined && !isProcessAlive(devRunnerPid)) {
      void shutdown("dev-runner-exit", 0);
      return;
    }

    if (process.ppid !== parentPid) {
      console.error(
        `[watch] parent process ${parentPid} exited; shutting down orphaned watcher.`,
      );
      void shutdown("parent-exit", 0);
    }
  }, WATCH_PARENT_POLL_MS);
  parentPollTimer.unref?.();

  process.once("SIGINT", () => void shutdown("SIGINT", 0));
  process.once("SIGTERM", () => void shutdown("SIGTERM", 0));
  process.once("SIGHUP", () => void shutdown("SIGHUP", 0));
  process.once("SIGQUIT", () => void shutdown("SIGQUIT", 0));

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
