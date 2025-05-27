const { resolve } = require("path");
const { readdir } = require("fs-extra");
const { build, context } = require("esbuild");
const { watch } = require("watchlist");
const sveltePlugin = require("esbuild-svelte");
const sveltePreprocess = require("svelte-preprocess");

const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch");

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
      entryPoints: ["src/renderer/manager/main.ts"],
      outfile: "public/manager/build/main.js",
      bundle: true,
      format: "cjs",
      platform: "browser",
      target: "es2019",
      sourcemap: !isProduction,
      minify: isProduction,
      external: ["electron"],
      banner: {
        // core-js: polyfill for modern JavaScript features
        // regenerator-runtime: don't know
        js: String.raw`
        require('core-js/stable');
        require('regenerator-runtime/runtime');`,
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
              tsconfigFile: "./tsconfig.json",
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

      const svelteCtx = await context(svelteConfig);

      await Promise.all([
        ...contexts.map(async ({ context, rebuildWithNewFiles }, index) => {
          const dirs = ["./src/main", "./src/common", "./src/renderer"][index];
          await watch([dirs], async () => {
            console.log(`Changes detected in ${dirs}, rebuilding...`);
            await rebuildWithNewFiles();
          });
          return context.watch();
        }),
        (async () => {
          await watch(["./src/renderer/manager"], async () => {
            console.log("Changes detected in Svelte files, rebuilding...");
            await svelteCtx.rebuild();
          });
          return svelteCtx.watch();
        })(),
      ]);

      console.log("Watching for changes...");
    } else {
      // One-time build
      const builds = ["main", "common", "renderer"].map(async (type) => {
        console.time(`${type} took`);
        await build({
          ...commonConfig,
          entryPoints: await readdirp(`./src/${type}/`),
          outdir: `dist/${type}/`,
        });
        console.timeEnd(`${type} took`);
      });

      builds.push(build(svelteConfig));

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
