const { resolve } = require("path");
const { readdir, copy, ensureDir } = require("fs-extra");
const { build, context } = require("esbuild");
const { watch } = require("watchlist");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");
const postCssPlugin = require("esbuild-postcss");

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
const readdirp = async (dir) => {
  const dirents = await readdir(dir, { withFileTypes: true });
  const filtered = dirents.filter((dirent) => {
    if (dirent.isFile()) {
      return !dirent.name.startsWith(".") && dirent.name.endsWith(".ts");
    }
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
  const htmlFiles = [
    { src: "./src/renderer/game/index.html", dest: "./dist/game/index.html" },
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
      src: "./src/renderer/tools/hotkeys/index.html",
      dest: "./dist/tools/hotkeys/index.html",
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

  for (const { src, dest } of htmlFiles) {
    try {
      await ensureDir(resolve(dest, ".."));
      await copy(src, dest);
      // console.log(`Copied ${src} -> ${dest}`);
    } catch (error) {
      console.error(`Failed to copy ${src} -> ${dest}:`, error);
    }
  }
}

/**
 * @param {import('esbuild').BuildOptions} config
 * @param {string} srcDir
 * @param {string} outDir
 * @param {string} contextName
 * @returns {Promise<{ context: import('esbuild').Context, rebuildWithNewFiles: () => Promise<void> }>}
 */
async function createBuildContext(config, srcDir, outDir, contextName) {
  const createRebuildPlugin = (context) => ({
    name: `rebuild-logger-${context}`,
    setup(build) {
      build.onStart(() => {
        console.time(`${context} rebuild`);
      });
      build.onEnd((result) => {
        const timestamp = new Date().toLocaleTimeString();
        if (result.errors.length > 0) {
          console.error(
            `[${timestamp}] ${context} rebuild failed:`,
            result.errors,
          );
        } else {
          console.timeEnd(`${context} rebuild`);
          console.log(`[${timestamp}] ${context} rebuilt successfully`);
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
      plugins: [createRebuildPlugin(contextName)],
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
    };

    /**
     *
     * @param {string} entryPoint - The entry point for the Svelte application
     * @param {string} outfile - The output file path
     * @param {string} tsconfigFile - The path to the TypeScript config file
     * @returns
     */
    const createSvelteConfig = (entryPoint, outfile, tsconfigFile) => ({
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
        "winston",
        "process",
        "util",
        "fs",
        "path",
        "os",
        "assert",
        "stream",
        "events",
        "constants",
      ],
      banner: {
        js: "require('core-js/stable')",
      },
      plugins: [
        sveltePlugin({
          compilerOptions: {
            dev: !isProduction,
            css: "injected",
          },
          preprocess: sveltePreprocess({
            sourceMap: isProduction ? false : true,
            typescript: {
              tsconfigFile,
            },
          }),
        }),
      ],
    });

    const svelteConfigs = [
      {
        name: "manager",
        config: createSvelteConfig(
          "./src/renderer/manager/main.ts",
          "./dist/manager/build/main.js",
          "./src/renderer/manager/tsconfig.json",
        ),
        watchPath: "./src/renderer/manager",
      },
      {
        name: "game",
        config: createSvelteConfig(
          "./src/renderer/game/main.ts",
          "./dist/game/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/game",
      },
      {
        name: "fast-travels",
        config: createSvelteConfig(
          "./src/renderer/tools/fast-travels/main.ts",
          "./dist/tools/fast-travels/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/tools/fast-travels",
      },
      {
        name: "loader-grabber",
        config: createSvelteConfig(
          "./src/renderer/tools/loader-grabber/main.ts",
          "./dist/tools/loader-grabber/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/tools/loader-grabber",
      },
      {
        name: "follower",
        config: createSvelteConfig(
          "./src/renderer/tools/follower/main.ts",
          "./dist/tools/follower/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/tools/follower",
      },
      {
        name: "hotkeys",
        config: createSvelteConfig(
          "./src/renderer/tools/hotkeys/main.ts",
          "./dist/tools/hotkeys/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/tools/hotkeys",
      },
      {
        name: "packet-logger",
        config: createSvelteConfig(
          "./src/renderer/packets/logger/main.ts",
          "./dist/packets/logger/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/packets/logger",
      },
      {
        name: "packet-spammer",
        config: createSvelteConfig(
          "./src/renderer/packets/spammer/main.ts",
          "./dist/packets/spammer/build/main.js",
          "./src/renderer/game/tsconfig.json",
        ),
        watchPath: "./src/renderer/packets/spammer",
      },
    ];

    const cssConfigs = [
      {
        name: "tailwind",
        config: {
          entryPoints: ["./src/renderer/tailwind.css"],
          outfile: "./dist/build/tailwind.css",
          bundle: true,
          minify: isProduction,
          sourcemap: isProduction ? false : true,
          plugins: [postCssPlugin()],
        },
        watchPath: "./src/renderer/tailwind.css",
      },
    ];

    if (isWatch) {
      const contexts = await Promise.all([
        createBuildContext(commonConfig, "./src/main/", "dist/main/", "Main"),
        createBuildContext(
          commonConfig,
          "./src/shared/",
          "dist/shared/",
          "Shared",
        ),
        createBuildContext(
          commonConfig,
          "./src/renderer/",
          "dist/renderer/",
          "Renderer",
        ),
      ]);

      let svelteContexts = [];
      let cssContexts = [];

      try {
        for (const { name, config } of svelteConfigs) {
          const ctx = await context(config);
          svelteContexts.push({ name, context: ctx, config });
        }

        for (const { name, config } of cssConfigs) {
          const ctx = await context(config);
          cssContexts.push({ name, context: ctx, config });
        }
      } catch (error) {
        console.error("Failed to create build contexts:", error);
        throw error;
      }

      await Promise.all([
        ...contexts.map(async ({ context, rebuildWithNewFiles }, index) => {
          const dirs = ["./src/main", "./src/renderer", "./src/shared"][index];
          try {
            await watch([dirs], async () => {
              console.log(`Changes detected in ${dirs}, rebuilding...`);
              try {
                await rebuildWithNewFiles();
              } catch (error) {
                console.error(`Failed to rebuild ${dirs}:`, error);
              }
            });
            return context.watch();
          } catch (error) {
            console.error(`Failed to start file watching for ${dirs}:`, error);
            throw error;
          }
        }),
        ...svelteContexts.map(({ name, context: ctx }) => {
          const svelteConfig = svelteConfigs.find(
            (config) => config.name === name,
          );
          return (async () => {
            try {
              await watch([svelteConfig.watchPath], async () => {
                console.log(
                  `Changes detected in ${name} Svelte files, rebuilding...`,
                );
                try {
                  await ctx.rebuild();
                } catch (error) {
                  console.error(`${name} Svelte rebuild failed:`, error);
                }
              });
              return ctx.watch();
            } catch (error) {
              console.error(
                `Failed to start ${name} Svelte file watching:`,
                error,
              );
              throw error;
            }
          })();
        }),
        ...cssContexts.map(({ name, context: ctx }) => {
          const cssConfig = cssConfigs.find((config) => config.name === name);
          return (async () => {
            try {
              await watch(
                [cssConfig.watchPath, "./tailwind.config.js"],
                async () => {
                  console.log(
                    `Changes detected in ${name} CSS files, rebuilding...`,
                  );
                  try {
                    await ctx.rebuild();
                  } catch (error) {
                    console.error(`${name} CSS rebuild failed:`, error);
                  }
                },
              );
              return ctx.watch();
            } catch (error) {
              console.error(
                `Failed to start ${name} CSS file watching:`,
                error,
              );
              throw error;
            }
          })();
        }),
      ]);

      console.log("Watching for changes...");
    } else {
      // One-time build
      const builds = ["main", "shared", "renderer"].map(async (type) => {
        console.time(`${type} took`);
        try {
          await build({
            ...commonConfig,
            entryPoints: await readdirp(`./src/${type}/`),
            outdir: `dist/${type}/`,
          });
          console.timeEnd(`${type} took`);
        } catch (error) {
          console.timeEnd(`${type} took`);
          console.error(`${type} build failed:`, error);
          throw error;
        }
      });

      // Add all Svelte builds
      svelteConfigs.forEach(({ name, config }) => {
        builds.push(
          (async () => {
            console.time(`${name} svelte took`);
            try {
              await build(config);
              console.timeEnd(`${name} svelte took`);
            } catch (error) {
              console.timeEnd(`${name} svelte took`);
              console.error(`${name} Svelte build failed:`, error);
              throw error;
            }
          })(),
        );
      });

      // Add all CSS builds
      cssConfigs.forEach(({ name, config }) => {
        builds.push(
          (async () => {
            console.time(`${name} css took`);
            try {
              await build(config);
              console.timeEnd(`${name} css took`);
            } catch (error) {
              console.timeEnd(`${name} css took`);
              console.error(`${name} CSS build failed:`, error);
              throw error;
            }
          })(),
        );
      });

      // Copy HTML files
      builds.push(
        (async () => {
          console.time("HTML copy took");
          try {
            await copyHtmlFiles();
            console.timeEnd("HTML copy took");
          } catch (error) {
            console.timeEnd("HTML copy took");
            console.error("HTML copy failed:", error);
            throw error;
          }
        })(),
      );

      await Promise.all(builds);
    }
  } catch (error) {
    console.log(`An error occurred while transpiling: ${error}`);
    if (!isWatch) {
      process.exit(1);
    }
  }
}

transpile();
