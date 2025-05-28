const { resolve } = require("path");
const { readdir } = require("fs-extra");
const { build, context } = require("esbuild");
const { watch } = require("watchlist");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");

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
      // minify: true,
      sourcemap: true,
      treeShaking: true,
    };

    /**
     * @type {import('esbuild').BuildOptions}
     */
    const svelteConfig = {
      entryPoints: ["./src/renderer/manager/main.ts"],
      outfile: "./public/manager/build/main.js",
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
      external: ["electron"],
      banner: {
        // core-js: polyfill for modern JavaScript features
        js: "require('core-js/stable')",
      },
      plugins: [
        sveltePlugin({
          compilerOptions: {
            dev: !isProduction,
            css: "injected",
          },
          preprocess: sveltePreprocess({
            sourceMap: !isProduction,
            typescript: {
              tsconfigFile: "./src/renderer/manager/tsconfig.json",
            },
          }),
        }),
      ],
    };

    if (isWatch) {
      const contexts = await Promise.all([
        createBuildContext(commonConfig, "./src/main/", "dist/main/", "Main"),
        createBuildContext(
          commonConfig,
          "./src/common/",
          "dist/common/",
          "Common",
        ),
        createBuildContext(
          commonConfig,
          "./src/renderer/",
          "dist/renderer/",
          "Renderer",
        ),
      ]);

      let svelteCtx;
      try {
        svelteCtx = await context(svelteConfig);
      } catch (error) {
        console.error("Failed to create Svelte context:", error);
        throw error;
      }

      await Promise.all([
        ...contexts.map(async ({ context, rebuildWithNewFiles }, index) => {
          const dirs = ["./src/main", "./src/common", "./src/renderer"][index];
          try {
            await watch([dirs], async () => {
              console.log(`Changes detected in ${dirs}, rebuilding...`);
              try {
                await rebuildWithNewFiles();
              } catch (error) {
                console.error(`Failed to rebuild ${dirs}:`, error);
                // Continue watching even if rebuild fails
              }
            });
            return context.watch();
          } catch (error) {
            console.error(`Failed to start file watching for ${dirs}:`, error);
            throw error;
          }
        }),
        (async () => {
          try {
            await watch(["./src/renderer/manager"], async () => {
              console.log("Changes detected in Svelte files, rebuilding...");
              try {
                await svelteCtx.rebuild();
              } catch (error) {
                console.error("Svelte rebuild failed:", error);
              }
            });
            return svelteCtx.watch();
          } catch (error) {
            console.error("Failed to start Svelte file watching:", error);
            throw error;
          }
        })(),
      ]);

      console.log("Watching for changes...");
    } else {
      // One-time build
      const builds = ["main", "common", "renderer"].map(async (type) => {
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

      builds.push(
        (async () => {
          console.time("svelte took");
          try {
            await build(svelteConfig);
            console.timeEnd("svelte took");
          } catch (error) {
            console.timeEnd("svelte took");
            console.error("Svelte build failed:", error);
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
