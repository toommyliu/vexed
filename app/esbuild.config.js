const { resolve, dirname } = require("path");
const { readdir, copy, ensureDir, readFileSync } = require("fs-extra");
const { build, context } = require("esbuild");
const { watch } = require("watchlist");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");
const postCssPlugin = require("esbuild-postcss");
const alias = require("esbuild-plugin-alias");
const { parse } = require("jsonc-parser");

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

function getPathAliases() {
  try {
    const tsconfigPath = resolve(__dirname, "tsconfig.json");
    const tsconfigContent = readFileSync(tsconfigPath, "utf8");
    const tsconfig = parse(tsconfigContent);

    const paths = tsconfig.compilerOptions?.paths || {};
    const baseUrl = tsconfig.compilerOptions?.baseUrl || "./";

    const aliases = {};

    for (const [aliasKey, aliasPaths] of Object.entries(paths)) {
      const cleanKey = aliasKey.replace("/*", "");
      const firstPath = aliasPaths[0];
      const cleanPath = firstPath.replace("/*", "");
      aliases[cleanKey] = resolve(__dirname, baseUrl, cleanPath);
    }

    return aliases;
  } catch (error) {
    console.warn("Failed to read tsconfig.json paths:", error.message);
    return {};
  }
}

const pathAliases = getPathAliases();

const SCRIPT_TARGETS = [
  {
    name: "main",
    srcDir: "./src/main/",
    outDir: "dist/main/",
    watchPaths: ["./src/main"],
  },
  {
    name: "shared",
    srcDir: "./src/shared/",
    outDir: "dist/shared/",
    watchPaths: ["./src/shared"],
  },
  {
    name: "renderer",
    srcDir: "./src/renderer/",
    outDir: "dist/renderer/",
    watchPaths: ["./src/renderer"],
  },
];

const SVELTE_TARGETS = [
  {
    name: "manager",
    entryPoint: "./src/renderer/manager/main.ts",
    outfile: "./dist/manager/build/main.js",
    tsconfigFile: "./src/renderer/manager/tsconfig.json",
    watchPaths: ["./src/renderer/manager"],
  },
  {
    name: "game",
    entryPoint: "./src/renderer/game/main.ts",
    outfile: "./dist/game/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/game"],
  },
  {
    name: "game-logs",
    entryPoint: "./src/renderer/application/logs/main.ts",
    outfile: "./dist/application/logs/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/application/logs"],
  },
  {
    name: "fast-travels",
    entryPoint: "./src/renderer/tools/fast-travels/main.ts",
    outfile: "./dist/tools/fast-travels/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/tools/fast-travels"],
  },
  {
    name: "loader-grabber",
    entryPoint: "./src/renderer/tools/loader-grabber/main.ts",
    outfile: "./dist/tools/loader-grabber/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/tools/loader-grabber"],
  },
  {
    name: "follower",
    entryPoint: "./src/renderer/tools/follower/main.ts",
    outfile: "./dist/tools/follower/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/tools/follower"],
  },
  {
    name: "hotkeys",
    entryPoint: "./src/renderer/application/hotkeys/main.ts",
    outfile: "./dist/application/hotkeys/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/application/hotkeys"],
  },
  {
    name: "packet-logger",
    entryPoint: "./src/renderer/packets/logger/main.ts",
    outfile: "./dist/packets/logger/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/packets/logger"],
  },
  {
    name: "packet-spammer",
    logLabel: "packet-spammer svelte took",
    entryPoint: "./src/renderer/packets/spammer/main.ts",
    outfile: "./dist/packets/spammer/build/main.js",
    tsconfigFile: "./src/renderer/game/tsconfig.json",
    watchPaths: ["./src/renderer/packets/spammer"],
  },
];

const CSS_TARGETS = [
  {
    name: "tailwind",
    entryPoint: "./src/renderer/tailwind.css",
    outfile: "./dist/build/tailwind.css",
    watchPaths: ["./src/renderer/tailwind.css", "./tailwind.config.js"],
  },
];

const HTML_COPY_TARGETS = [
  { src: "./src/renderer/game/index.html", dest: "./dist/game/index.html" },
  {
    src: "./src/renderer/application/logs/index.html",
    dest: "./dist/application/logs/index.html",
  },
  {
    src: "./src/renderer/manager/index.html",
    dest: "./dist/manager/index.html",
  },
  {
    src: "./src/renderer/tools/fast-travels/index.html",
    dest: "./dist/tools/fast-travels/index.html",
  },
  {
    src: "./src/renderer/tools/follower/index.html",
    dest: "./dist/tools/follower/index.html",
  },
  {
    src: "./src/renderer/tools/loader-grabber/index.html",
    dest: "./dist/tools/loader-grabber/index.html",
  },
  {
    src: "./src/renderer/application/hotkeys/index.html",
    dest: "./dist/application/hotkeys/index.html",
  },
  {
    src: "./src/renderer/packets/logger/index.html",
    dest: "./dist/packets/logger/index.html",
  },
  {
    src: "./src/renderer/packets/spammer/index.html",
    dest: "./dist/packets/spammer/index.html",
  },
];

const toArray = (value) => (Array.isArray(value) ? value : [value]);

const timed = async (label, fn) => {
  console.time(label);
  try {
    const result = await fn();
    console.timeEnd(label);
    return result;
  } catch (error) {
    console.timeEnd(label);
    throw error;
  }
};

const createSvelteConfig = ({ entryPoint, outfile, tsconfigFile }) => ({
  entryPoints: [entryPoint],
  outfile,
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: "es2019",
  sourcemap: !isProduction,
  minify: isProduction,
  loader: {
    ".ts": "ts",
    ".js": "js",
  },
  conditions: ["svelte", "browser", "default"],
  external: [
    "electron",
    "process",
    "util",
    "fs",
    "path",
    "os",
    "assert",
    "stream",
    "events",
    "constants",
    "net",
    "url",
    "querystring",
    "http",
    "https",
  ],
  banner: {
    js: "require('core-js/stable')",
  },
  plugins: [
    alias(pathAliases),
    sveltePlugin({
      compilerOptions: {
        dev: !isProduction,
        css: "injected",
      },
      preprocess: sveltePreprocess({
        sourceMap: !isProduction,
        typescript: {
          tsconfigFile,
        },
      }),
    }),
  ],
});

const createCssConfig = ({ entryPoint, outfile }) => ({
  entryPoints: [entryPoint],
  outfile,
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  plugins: [alias(pathAliases), postCssPlugin()],
});

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const readdirp = async (dir) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const filtered = dirents.filter((dirent) => {
    if (dirent.isFile())
      return !dirent.name.startsWith(".") && dirent.name.endsWith(".ts");
    return true;
  });
  const files = await Promise.all(
    filtered.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? readdirp(res) : res;
    }),
  );
  return Array.prototype.concat(...files);
};

/**
 * Copy HTML files from src/renderer to dist
 * @returns {Promise<void>}
 */
async function copyHtmlFiles() {
  await Promise.all(
    HTML_COPY_TARGETS.map(async ({ src, dest }) => {
      try {
        const sourcePath = resolve(__dirname, src);
        const destinationPath = resolve(__dirname, dest);
        await ensureDir(dirname(destinationPath));
        await copy(sourcePath, destinationPath);
      } catch (error) {
        console.error(`Failed to copy ${src} -> ${dest}:`, error);
      }
    }),
  );
}

/**
 * @param {import('esbuild').BuildOptions} config
 * @param {string} srcDir
 * @param {string} outDir
 * @param {string} contextName
 * @returns {Promise<{ context: import('esbuild').Context, rebuildWithNewFiles: () => Promise<void> }>}
 */
async function createBuildContext(config, srcDir, outDir, contextName) {
  const createRebuildPlugin = (contextLabel) => ({
    name: `rebuild-logger-${contextLabel}`,
    setup(build) {
      build.onStart(() => {
        console.time(`${contextLabel} rebuild`);
      });
      build.onEnd((result) => {
        const timestamp = new Date().toLocaleTimeString();
        if (result.errors.length > 0) {
          console.error(
            `[${timestamp}] ${contextLabel} rebuild failed:`,
            result.errors,
          );
        } else {
          console.timeEnd(`${contextLabel} rebuild`);
          console.log(`[${timestamp}] ${contextLabel} rebuilt successfully`);
        }
      });
    },
  });

  let buildCtx = null;
  let currentEntryPoints = await readdirp(srcDir);

  const createNewContext = async (entryPoints) => {
    if (buildCtx) {
      await buildCtx.dispose();
      buildCtx = null;
    }

    buildCtx = await context({
      ...config,
      entryPoints,
      outdir: outDir,
      plugins: [...(config.plugins || []), createRebuildPlugin(contextName)],
    });

    return buildCtx;
  };

  buildCtx = await createNewContext(currentEntryPoints);

  const rebuildWithNewFiles = async () => {
    try {
      const newEntryPoints = await readdirp(srcDir);

      currentEntryPoints = newEntryPoints;
      buildCtx = await createNewContext(currentEntryPoints);

      return buildCtx.watch();
    } catch (error) {
      console.error(`[${contextName}] Error during rebuild:`, error);
      buildCtx = await createNewContext(currentEntryPoints);
      return buildCtx.watch();
    }
  };

  return { context: buildCtx, rebuildWithNewFiles };
}

async function watchAndRebuild({ name, paths, onChange, start }) {
  const watchTargets = toArray(paths).map((targetPath) =>
    resolve(__dirname, targetPath),
  );

  try {
    await watch(watchTargets, async () => {
      console.log(`Changes detected in ${name}, rebuilding...`);
      try {
        await onChange();
      } catch (error) {
        console.error(`${name} rebuild failed:`, error);
      }
    });

    return start();
  } catch (error) {
    console.error(`Failed to start watching ${name}:`, error);
    throw error;
  }
}

async function runWatchMode(commonConfig, svelteConfigs, cssConfigs) {
  const scriptContexts = await Promise.all(
    SCRIPT_TARGETS.map(async (target) => {
      const { context: ctx, rebuildWithNewFiles } = await createBuildContext(
        commonConfig,
        target.srcDir,
        target.outDir,
        target.name,
      );

      return { target, context: ctx, rebuildWithNewFiles };
    }),
  );

  const svelteContexts = await Promise.all(
    svelteConfigs.map(async (target) => {
      const ctx = await context(target.config);
      return { target, context: ctx };
    }),
  );

  const cssContexts = await Promise.all(
    cssConfigs.map(async (target) => {
      const ctx = await context(target.config);
      return { target, context: ctx };
    }),
  );

  await Promise.all([
    ...scriptContexts.map(({ target, context: ctx, rebuildWithNewFiles }) =>
      watchAndRebuild({
        name: `${target.name} scripts`,
        paths: target.watchPaths,
        onChange: rebuildWithNewFiles,
        start: () => ctx.watch(),
      }),
    ),
    ...svelteContexts.map(({ target, context: ctx }) =>
      watchAndRebuild({
        name: `${target.name} Svelte`,
        paths: target.watchPaths,
        onChange: () => ctx.rebuild(),
        start: () => ctx.watch(),
      }),
    ),
    ...cssContexts.map(({ target, context: ctx }) =>
      watchAndRebuild({
        name: `${target.name} CSS`,
        paths: target.watchPaths,
        onChange: () => ctx.rebuild(),
        start: () => ctx.watch(),
      }),
    ),
  ]);

  console.log("Watching for changes...");
}

async function runBuildMode(commonConfig, svelteConfigs, cssConfigs) {
  await Promise.all([
    ...SCRIPT_TARGETS.map((target) =>
      timed(`${target.name} took`, async () => {
        await build({
          ...commonConfig,
          entryPoints: await readdirp(target.srcDir),
          outdir: target.outDir,
        });
      }),
    ),
    ...svelteConfigs.map((target) =>
      timed(`${target.name} svelte took`, async () => {
        await build(target.config);
      }),
    ),
    ...cssConfigs.map((target) =>
      timed(`${target.name} css took`, async () => {
        await build(target.config);
      }),
    ),
    timed("HTML copy took", copyHtmlFiles),
  ]);
}

/**
 * @returns {Promise<void>}
 */
async function transpile() {
  try {
    /**
     * @type {import('esbuild').BuildOptions}
     */
    const commonConfig = {
      platform: "node",
      target: "chrome76",
      format: "cjs",
      minify: isProduction,
      sourcemap: !isProduction,
      treeShaking: true,
      plugins: [alias(pathAliases)],
    };

    const svelteConfigs = SVELTE_TARGETS.map((target) => ({
      ...target,
      config: createSvelteConfig(target),
    }));

    const cssConfigs = CSS_TARGETS.map((target) => ({
      ...target,
      config: createCssConfig(target),
    }));

    if (isWatch) {
      await runWatchMode(commonConfig, svelteConfigs, cssConfigs);
    } else {
      await runBuildMode(commonConfig, svelteConfigs, cssConfigs);
    }
  } catch (error) {
    console.log(`An error occurred while transpiling: ${error}`);
    if (!isWatch) {
      process.exit(1);
    }
  }
}

transpile();
