import path from "node:path";
import {
  build,
  context,
  type BuildOptions,
  type BuildContext,
  type Plugin,
} from "esbuild";
import fsExtra from "fs-extra";
import { parse } from "jsonc-parser";
import postCssPlugin from "esbuild-postcss";
import sveltePlugin from "esbuild-svelte";
import { aliasPath } from "esbuild-plugin-alias-path";
import * as svelteVitePlugin from "@sveltejs/vite-plugin-svelte";
// @ts-expect-error no package.json exports field
import watchlist from "watchlist";

const { dirname, relative, resolve, sep, posix } = path;
const { readdir, ensureDir, readFileSync, readFile, writeFile } = fsExtra;
const { watch } = watchlist as unknown as {
  watch: (
    paths: string | string[],
    callback: () => void | Promise<void>,
  ) => void;
};

const ROOT_DIR = process.cwd();
const isProduction = process.env.NODE_ENV === "production";
const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

const EFFECT_CJS_PATH = resolve(ROOT_DIR, "dist/vendor/effect.cjs");

type AliasMap = Record<string, string>;

type ScriptTarget = {
  name: string;
  srcDir: string;
  outDir: string;
  watchPaths: string[];
};

type CssTarget = {
  name: string;
  entryPoint: string;
  outfile: string;
  watchPaths: string[];
};

// If anything requires dist/renderer/**, enable this env var */
const SHOULD_TRANSPILE_RENDERER_SOURCES =
  process.env.BUILD_RENDERER_TRANSPILE === "1";

const SCRIPT_TARGETS: ScriptTarget[] = [
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
  ...(SHOULD_TRANSPILE_RENDERER_SOURCES
    ? [
        {
          name: "renderer",
          srcDir: "./src/renderer/",
          outDir: "dist/renderer/",
          watchPaths: ["./src/renderer"],
        },
      ]
    : []),
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

const RENDERER_ENTRYPOINTS: Record<string, string> = {
  "manager/build/main": "./src/renderer/apps/manager/main.ts",
  "game/build/main": "./src/renderer/apps/game/main.ts",
  "onboarding/build/main": "./src/renderer/apps/onboarding/main.ts",
  ...SUB_WINDOWS.reduce<Record<string, string>>((acc, name) => {
    acc[`views/${name}/build/main`] = `./src/renderer/views/${name}/main.ts`;
    return acc;
  }, {}),
};

const CSS_TARGETS: CssTarget[] = [
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

const importRegex =
  /((?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"])([^'"]+)(['"])/g;
const dynamicImportRegex = /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;
const requireRegex = /(require\s*\(\s*['"])([^'"]+)(['"]\s*\))/g;

function readTsconfigAliases(): AliasMap {
  try {
    const tsconfigPath = resolve(ROOT_DIR, "tsconfig.json");
    const tsconfigContent = readFileSync(tsconfigPath, "utf8");
    const tsconfig = parse(tsconfigContent) as {
      compilerOptions?: { paths?: Record<string, string[]>; baseUrl?: string };
    };

    const compilerOptions = tsconfig.compilerOptions ?? {};
    const paths = compilerOptions.paths ?? {};
    const baseUrl = compilerOptions.baseUrl ?? "./";

    const aliases: AliasMap = {};

    for (const [aliasKey, aliasPaths] of Object.entries(paths)) {
      const firstPath = aliasPaths?.[0];
      if (!firstPath) continue;

      const cleanPath = firstPath.replace("/*", "");
      aliases[aliasKey] = resolve(ROOT_DIR, baseUrl, cleanPath);
    }

    return aliases;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("Failed to read tsconfig aliases:", message);
    return {};
  }
}

const pathAliases = Object.fromEntries(
  Object.entries(readTsconfigAliases()).filter(([, value]) => value != null),
);

function getLoader(filePath: string): "js" | "ts" {
  if (filePath.endsWith(".js")) return "js";
  return "ts";
}

function toRelativeImport(fromFile: string, toFile: string): string {
  let importPath = relative(dirname(fromFile), toFile);
  importPath = importPath.split(sep).join(posix.sep);

  if (!importPath.startsWith(".")) {
    importPath = `./${importPath}`;
  }

  return importPath;
}

function createImportTransformPlugin(params: {
  aliases: AliasMap;
  effectCjsPath: string;
}): Plugin {
  const { aliases, effectCjsPath } = params;

  const sortedAliases = Object.entries(aliases)
    .map(([pattern, target]) => ({
      prefix: pattern.replace("/*", ""),
      target,
    }))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  return {
    name: "import-transform",
    setup(esbuildBuild) {
      esbuildBuild.onLoad({ filter: /\.[tj]sx?$/ }, async (args) => {
        const source = await readFile(args.path, "utf8");

        const couldContainTransformTarget =
          source.includes("effect") ||
          sortedAliases.some((alias) => source.includes(alias.prefix));

        if (!couldContainTransformTarget) {
          return undefined;
        }

        let transformed = source;
        let unsupportedEffectSubpath: string | null = null;

        const rewriteSpecifier = (
          match: string,
          prefix: string,
          modulePath: string,
          suffix: string,
        ) => {
          if (modulePath === "effect") {
            return `${prefix}${toRelativeImport(args.path, effectCjsPath)}${suffix}`;
          }

          if (modulePath.startsWith("effect/")) {
            unsupportedEffectSubpath = modulePath;
            return match;
          }

          for (const alias of sortedAliases) {
            if (
              modulePath === alias.prefix ||
              modulePath.startsWith(`${alias.prefix}/`)
            ) {
              const subPath = modulePath.slice(alias.prefix.length);
              const absoluteTarget = alias.target + subPath;
              return `${prefix}${toRelativeImport(args.path, absoluteTarget)}${suffix}`;
            }
          }

          return match;
        };

        transformed = transformed.replace(importRegex, rewriteSpecifier);
        transformed = transformed.replace(dynamicImportRegex, rewriteSpecifier);
        transformed = transformed.replace(requireRegex, rewriteSpecifier);

        if (unsupportedEffectSubpath) {
          throw new Error(
            `[import-transform] Unsupported Effect subpath import "${unsupportedEffectSubpath}" in ${args.path}. ` +
              `Use root imports from "effect" (example: import { Effect, Schema } from "effect").`,
          );
        }

        if (transformed === source) {
          return undefined;
        }

        return {
          contents: transformed,
          loader: getLoader(args.path),
        };
      });
    },
  };
}

const filterArkWarningsPlugin: Plugin = {
  name: "filter-ark-warnings",
  setup(esbuildBuild) {
    esbuildBuild.onEnd((result) => {
      result.warnings = result.warnings.filter((warning) => {
        const file = warning.location?.file ?? "";
        const text = warning.text ?? "";

        const isArkWarning =
          file.includes("@ark-ui") ||
          text.includes("@ark-ui") ||
          file.includes("node_modules/@ark-ui");

        return !isArkWarning;
      });
    });
  },
};

const createRebuildLoggerPlugin = (label: string): Plugin => ({
  name: `rebuild-logger-${label}`,
  setup(esbuildBuild) {
    esbuildBuild.onStart(() => {
      console.time(`${label} rebuild`);
    });

    esbuildBuild.onEnd((result) => {
      if (result.errors.length > 0) {
        console.error(`[${label}] rebuild failed:`, result.errors);
        return;
      }

      console.timeEnd(`${label} rebuild`);
    });
  },
});

const timed = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
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

const createSvelteConfig = (params: {
  entryPoints: Record<string, string>;
  outdir: string;
}): BuildOptions => ({
  entryPoints: params.entryPoints,
  outdir: params.outdir,
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
      },
      preprocess: svelteVitePlugin.vitePreprocess(),
    }),
    filterArkWarningsPlugin,
  ],
  logLevel: "error",
});

const createCssConfig = (params: {
  entryPoint: string;
  outfile: string;
}): BuildOptions => ({
  entryPoints: [params.entryPoint],
  outfile: params.outfile,
  bundle: true,
  minify: isProduction,
  sourcemap: !isProduction,
  loader: {
    ".woff": "file",
    ".woff2": "file",
  },
  assetNames: "assets/[name]-[hash][ext]",
  plugins: [
    aliasPath({ alias: pathAliases }),
    postCssPlugin(),
    filterArkWarningsPlugin,
  ],
  logLevel: "error",
});

async function readSourceEntries(dir: string): Promise<string[]> {
  try {
    const dirents = await readdir(dir, { withFileTypes: true });
    if (!dirents.length) return [];

    const entries = await Promise.all(
      dirents
        .filter((entry) => !entry.name.startsWith("."))
        .map((entry) => {
          const fullPath = resolve(dir, entry.name);

          if (entry.isDirectory()) {
            return readSourceEntries(fullPath);
          }

          const isScript =
            fullPath.endsWith(".ts") || fullPath.endsWith(".tsx");
          return isScript ? [fullPath] : [];
        }),
    );

    return entries.flat();
  } catch {
    return [];
  }
}

async function generateHtmlFiles(): Promise<void> {
  const templatePath = resolve(ROOT_DIR, "./src/renderer/index.html");
  const template = await readFile(templatePath, "utf-8");
  const scriptPath = "build/main.js";

  const htmlTargets = [
    {
      dest: "./dist/game/index.html",
      cssPath: "../build/tailwind.css",
      scriptPath,
    },
    {
      dest: "./dist/manager/index.html",
      cssPath: "../build/tailwind.css",
      scriptPath,
    },
    {
      dest: "./dist/onboarding/index.html",
      cssPath: "../build/tailwind.css",
      scriptPath,
    },
    ...SUB_WINDOWS.map((name) => ({
      dest: `./dist/views/${name}/index.html`,
      cssPath: "../../build/tailwind.css",
      scriptPath,
    })),
  ];

  await Promise.all(
    htmlTargets.map(async (target) => {
      try {
        const destinationPath = resolve(ROOT_DIR, target.dest);
        await ensureDir(dirname(destinationPath));

        const html = template
          .replace("{{CSS_PATH}}", target.cssPath)
          .replace("{{SCRIPT_PATH}}", target.scriptPath);

        await writeFile(destinationPath, html, "utf-8");
      } catch (error) {
        console.error(`Failed to generate ${target.dest}:`, error);
      }
    }),
  );
}

async function createBuildContext(
  baseConfig: BuildOptions,
  target: ScriptTarget,
): Promise<{
  context: BuildContext;
  rebuildWithNewFiles: () => Promise<void>;
}> {
  let buildCtx: BuildContext | null = null;
  let currentEntryPoints = await readSourceEntries(target.srcDir);

  const createContextWithEntries = async (entryPoints: string[]) => {
    if (buildCtx) {
      await buildCtx.dispose();
      buildCtx = null;
    }

    buildCtx = await context({
      ...baseConfig,
      entryPoints,
      outdir: target.outDir,
      plugins: [
        ...(baseConfig.plugins ?? []),
        createRebuildLoggerPlugin(target.name),
      ],
    });

    return buildCtx;
  };

  buildCtx = await createContextWithEntries(currentEntryPoints);

  const rebuildWithNewFiles = async () => {
    const nextEntryPoints = await readSourceEntries(target.srcDir);

    const currentSet = new Set(currentEntryPoints);
    const nextSet = new Set(nextEntryPoints);

    const hasChanged =
      currentSet.size !== nextSet.size ||
      [...currentSet].some((file) => !nextSet.has(file));

    if (!hasChanged) {
      return;
    }

    console.log(`[${target.name}] entry points changed; recreating context...`);
    currentEntryPoints = nextEntryPoints;

    try {
      const nextCtx = await createContextWithEntries(currentEntryPoints);
      await nextCtx.watch();
    } catch (error) {
      console.error(`[${target.name}] failed to recreate context:`, error);
      const nextCtx = await createContextWithEntries(currentEntryPoints);
      await nextCtx.watch();
    }
  };

  return {
    context: buildCtx,
    rebuildWithNewFiles,
  };
}

async function runWatchMode(
  commonConfig: BuildOptions,
  svelteConfig: BuildOptions,
  cssConfigs: Array<{
    name: string;
    config: BuildOptions;
    watchPaths?: string[];
  }>,
): Promise<void> {
  const scriptContexts = await Promise.all(
    SCRIPT_TARGETS.map(async (target) => {
      const { context: ctx, rebuildWithNewFiles } = await createBuildContext(
        commonConfig,
        target,
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

  const svelteContext = await context({
    ...svelteConfig,
    plugins: [
      ...(svelteConfig.plugins ?? []),
      createRebuildLoggerPlugin("renderer Svelte"),
    ],
    logLevel: "error",
  });
  await svelteContext.watch();

  await Promise.all(
    cssConfigs.map(async (target) => {
      const cssContext = await context({
        ...target.config,
        plugins: [
          ...(target.config.plugins ?? []),
          createRebuildLoggerPlugin(`${target.name} CSS`),
        ],
      });
      await cssContext.watch();

      if (target.watchPaths?.length) {
        watch(target.watchPaths, async () => {
          await cssContext.rebuild();
        });
      }
    }),
  );

  console.log("Watching for changes...");
}

async function runBuildMode(
  commonConfig: BuildOptions,
  svelteConfig: BuildOptions,
  cssConfigs: Array<{ name: string; config: BuildOptions }>,
): Promise<void> {
  await Promise.all([
    ...SCRIPT_TARGETS.map((target) =>
      timed(`${target.name} took`, async () => {
        await build({
          ...commonConfig,
          entryPoints: await readSourceEntries(target.srcDir),
          outdir: target.outDir,
        });
      }),
    ),
    timed("renderer svelte took", async () => {
      await build(svelteConfig);
    }),
    ...cssConfigs.map((target) =>
      timed(`${target.name} css took`, async () => {
        await build(target.config);
      }),
    ),
    timed("HTML generation took", generateHtmlFiles),
  ]);
}

async function transpile(): Promise<void> {
  try {
    const importTransformPlugin = createImportTransformPlugin({
      aliases: pathAliases,
      effectCjsPath: EFFECT_CJS_PATH,
    });

    const commonConfig: BuildOptions = {
      platform: "node",
      target: "chrome76",
      format: "cjs",
      minify: isProduction,
      sourcemap: !isProduction,
      treeShaking: true,
      logLevel: "error",
      plugins: [
        importTransformPlugin,
        aliasPath({ alias: pathAliases }),
        filterArkWarningsPlugin,
      ],
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
    console.error(`An error occurred while transpiling: ${String(error)}`);
    if (!isWatch) {
      process.exit(1);
    }
  }
}

void transpile();
