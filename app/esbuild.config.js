const { resolve, dirname, relative, sep, posix } = require("path");
const { readdir, ensureDir, readFileSync } = require("fs-extra");
const { build, context } = require("esbuild");
const sveltePlugin = require("esbuild-svelte");
const postCssPlugin = require("esbuild-postcss");
const { aliasPath } = require("esbuild-plugin-alias-path");
const { parse } = require("jsonc-parser");
const { readFile, writeFile } = require("fs-extra");
const { watch } = require("watchlist");

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

function getPathAliases() {
  try {
    const tsconfigPath = resolve(__dirname, "tsconfig.json");
    const tsconfigContent = readFileSync(tsconfigPath, "utf8");
    const tsconfig = parse(tsconfigContent);

    const compilerOptions = tsconfig.compilerOptions || {};
    const paths = compilerOptions.paths || {};
    const baseUrl = compilerOptions.baseUrl || "./";

    const aliases = {};

    if (!paths || typeof paths !== "object") {
      return aliases;
    }

    for (const [aliasKey, aliasPaths] of Object.entries(paths)) {
      if (!Array.isArray(aliasPaths) || aliasPaths.length === 0) {
        continue;
      }
      const firstPath = aliasPaths[0];
      const cleanPath = firstPath.replace("/*", "");
      aliases[aliasKey] = resolve(__dirname, baseUrl, cleanPath);
    }

    return aliases;
  } catch (error) {
    console.warn("Failed to read tsconfig.json paths:", error.message);
    return {};
  }
}

const pathAliases = Object.fromEntries(
  Object.entries(getPathAliases()).filter(([, value]) => value != null),
);

/**
 * Creates an esbuild plugin that transforms path alias imports to relative paths.

 * @param {Record<string, string>} aliases - Map of alias patterns to absolute paths
 * @returns {import('esbuild').Plugin}
 */
function createAliasTransformPlugin(aliases) {
  const sortedAliases = Object.entries(aliases)
    .map(([pattern, target]) => ({
      prefix: pattern.replace("/*", ""),
      target,
    }))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  return {
    name: "alias-transform",
    setup(build) {
      build.onLoad({ filter: /\.[tj]sx?$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");
        const fileDir = dirname(args.path);

        const importRegex =
          /((?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"])([^'"]+)(['"])/g;
        const dynamicImportRegex = /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;
        const requireRegex = /(require\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;

        let transformed = source;

        const replaceAlias = (match, prefix, modulePath, suffix) => {
          for (const { prefix: aliasPrefix, target } of sortedAliases) {
            if (
              modulePath === aliasPrefix ||
              modulePath.startsWith(aliasPrefix + "/")
            ) {
              const subPath = modulePath.slice(aliasPrefix.length);
              const absoluteTarget = target + subPath;
              let relativePath = relative(fileDir, absoluteTarget);

              relativePath = relativePath.split(sep).join(posix.sep);

              if (!relativePath.startsWith(".")) {
                relativePath = "./" + relativePath;
              }

              return prefix + relativePath + suffix;
            }
          }
          return match;
        };

        transformed = transformed.replace(importRegex, replaceAlias);
        transformed = transformed.replace(dynamicImportRegex, replaceAlias);
        transformed = transformed.replace(requireRegex, replaceAlias);

        if (transformed !== source) {
          return {
            contents: transformed,
            loader: "ts",
          };
        }

        return undefined;
      });
    },
  };
}

const aliasTransformPlugin = createAliasTransformPlugin(pathAliases);

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

const SUB_WINDOWS = [
  "environment",
  "hotkeys",
  "fast-travels",
  "follower",
  "loader-grabber",
  "packet-logger",
  "packet-spammer",
];

const RENDERER_ENTRYPOINTS = {
  "manager/build/main": "./src/renderer/apps/manager/main.ts",
  "game/build/main": "./src/renderer/apps/game/main.ts",
  "onboarding/build/main": "./src/renderer/apps/onboarding/main.ts",
  ...SUB_WINDOWS.reduce((acc, name) => {
    acc[`views/${name}/build/main`] = `./src/renderer/views/${name}/main.ts`;
    return acc;
  }, {}),
};

const CSS_TARGETS = [
  {
    name: "tailwind",
    entryPoint: "./src/renderer/tailwind.css",
    outfile: "./dist/build/tailwind.css",
    watchPaths: [
      "./src/renderer/tailwind.css",
      "./tailwind.config.js",
      "./src",
      "../packages/ui/src",
    ],
  },
];

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

const createSvelteConfig = ({ entryPoints, outdir }) => ({
  entryPoints,
  outdir,
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
    aliasPath({ alias: pathAliases }),
    sveltePlugin({
      compilerOptions: {
        dev: !isProduction,
        css: "injected",
        warningFilter: (warning) =>
          !warning.filename?.includes("node_modules/bits-ui"),
      },
      preprocess: require("@sveltejs/vite-plugin-svelte").vitePreprocess(),
      filterWarnings: (warning) =>
        !warning.filename?.includes("node_modules/bits-ui"),
    }),
  ],
});

const createCssConfig = ({ entryPoint, outfile }) => ({
  entryPoints: [entryPoint],
  outfile,
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  loader: {
    ".woff": "file",
    ".woff2": "file",
  },
  assetNames: "assets/[name]-[hash][ext]",
  plugins: [aliasPath({ alias: pathAliases }), postCssPlugin()],
});

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const readdirp = async (dir) => {
  try {
    const dirents = await readdir(dir, { withFileTypes: true });
    if (!dirents || dirents.length === 0) {
      return [];
    }
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
  } catch (error) {
    return [];
  }
};

/**
 * Generate HTML files from template for each window
 * @returns {Promise<void>}
 */
async function generateHtmlFiles() {
  const templatePath = resolve(__dirname, "./src/renderer/index.html");
  const template = await readFile(templatePath, "utf-8");

  const SCRIPT_PATH = "build/main.js";

  const htmlTargets = [
    {
      dest: "./dist/game/index.html",
      cssPath: "../build/tailwind.css",
      scriptPath: SCRIPT_PATH,
    },
    {
      dest: "./dist/manager/index.html",
      cssPath: "../build/tailwind.css",
      scriptPath: SCRIPT_PATH,
    },
    {
      dest: "./dist/onboarding/index.html",
      cssPath: "../build/tailwind.css",
      scriptPath: SCRIPT_PATH,
    },
    ...SUB_WINDOWS.map((name) => ({
      dest: `./dist/views/${name}/index.html`,
      cssPath: "../../build/tailwind.css",
      scriptPath: SCRIPT_PATH,
    })),
  ];

  await Promise.all(
    htmlTargets.map(async ({ dest, cssPath, scriptPath }) => {
      try {
        const destinationPath = resolve(__dirname, dest);
        await ensureDir(dirname(destinationPath));

        const html = template
          .replace("{{CSS_PATH}}", cssPath)
          .replace("{{SCRIPT_PATH}}", scriptPath);

        await writeFile(destinationPath, html, "utf-8");
      } catch (error) {
        console.error(`Failed to generate ${dest}:`, error);
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
/**
 * @param {string} label
 * @returns {import('esbuild').Plugin}
 */
const createRebuildLoggerPlugin = (label) => ({
  name: `rebuild-logger-${label}`,
  setup(build) {
    build.onStart(() => {
      console.time(`${label} rebuild`);
    });
    build.onEnd((result) => {
      const timestamp = new Date().toLocaleTimeString();
      if (result.errors.length > 0) {
        console.error(`[${timestamp}] ${label} rebuild failed:`, result.errors);
      } else {
        console.timeEnd(`${label} rebuild`);
        // console.log(`[${timestamp}] ${label} rebuilt successfully`);
      }
    });
  },
});

/**
 * @param {import('esbuild').BuildOptions} config
 * @param {string} srcDir
 * @param {string} outDir
 * @param {string} contextName
 * @returns {Promise<{ context: import('esbuild').Context, rebuildWithNewFiles: () => Promise<void> }>}
 */
async function createBuildContext(config, srcDir, outDir, contextName) {
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
      plugins: [
        ...(config.plugins || []),
        createRebuildLoggerPlugin(contextName),
      ],
    });

    return buildCtx;
  };

  buildCtx = await createNewContext(currentEntryPoints);

  const rebuildWithNewFiles = async () => {
    try {
      const newEntryPoints = await readdirp(srcDir);

      const currentSet = new Set(currentEntryPoints);
      const newSet = new Set(newEntryPoints);

      const hasChanged =
        currentSet.size !== newSet.size ||
        [...currentSet].some((file) => !newSet.has(file));

      if (!hasChanged) {
        return;
      }

      console.log(
        `[${contextName}] Entry points changed, recreating context...`,
      );
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

async function runWatchMode(commonConfig, svelteConfigs, cssConfigs) {
  // 1. Script Targets: Watch for file additions/removals manually, let esbuild handle content changes
  const scriptContexts = await Promise.all(
    SCRIPT_TARGETS.map(async (target) => {
      const { context: ctx, rebuildWithNewFiles } = await createBuildContext(
        commonConfig,
        target.srcDir,
        target.outDir,
        target.name,
      );

      await ctx.watch();

      return { target, rebuildWithNewFiles };
    }),
  );

  scriptContexts.forEach(({ target, rebuildWithNewFiles }) => {
    watch(target.watchPaths, async () => {
      await rebuildWithNewFiles();
    });
  });

  // 2. Svelte Targets: Use esbuild's native watch
  const svelteConfig = {
    ...svelteConfigs,
    plugins: [
      ...(svelteConfigs.plugins || []),
      createRebuildLoggerPlugin("renderer Svelte"),
    ],
  };
  const svelteCtx = await context(svelteConfig);
  await svelteCtx.watch();

  // 3. CSS Targets: Use esbuild's native watch
  await Promise.all(
    cssConfigs.map(async (target) => {
      const config = {
        ...target.config,
        plugins: [
          ...(target.config.plugins || []),
          createRebuildLoggerPlugin(`${target.name} CSS`),
        ],
      };
      const ctx = await context(config);
      await ctx.watch();

      if (target.watchPaths) {
        watch(target.watchPaths, async () => {
          await ctx.rebuild();
        });
      }
    }),
  );

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
    timed("renderer svelte took", async () => {
      await build({ ...svelteConfigs });
    }),
    ...cssConfigs.map((target) =>
      timed(`${target.name} css took`, async () => {
        await build({ ...target.config });
      }),
    ),
    timed("HTML generation took", generateHtmlFiles),
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
      plugins: [aliasTransformPlugin, aliasPath({ alias: pathAliases })],
    };

    const rendererSvelteConfig = createSvelteConfig({
      entryPoints: RENDERER_ENTRYPOINTS,
      outdir: "./dist",
    });

    const cssConfigs = CSS_TARGETS.map((target) => ({
      ...target,
      config: createCssConfig(target),
    }));

    if (isWatch) {
      await runWatchMode(commonConfig, rendererSvelteConfig, cssConfigs);
    } else {
      await runBuildMode(commonConfig, rendererSvelteConfig, cssConfigs);
    }
  } catch (error) {
    console.log(`An error occurred while transpiling: ${error}`);
    if (!isWatch) {
      process.exit(1);
    }
  }
}

transpile();
