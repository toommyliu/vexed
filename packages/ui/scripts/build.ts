import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { solidPlugin } from "esbuild-plugin-solid";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

function run(command: string, args: ReadonlyArray<string>): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function buildCss(): Promise<void> {
  const tokens = await readFile(resolve(root, "src/styles/tokens.css"), "utf8");
  const components = await readFile(
    resolve(root, "src/styles/components.css"),
    "utf8",
  );

  await writeFile(resolve(dist, "tokens.css"), tokens);
  await writeFile(resolve(dist, "styles.css"), `${tokens}\n${components}`);
}

async function main(): Promise<void> {
  await rm(dist, { force: true, recursive: true });
  await mkdir(dist, { recursive: true });

  await build({
    bundle: true,
    conditions: ["solid", "browser"],
    entryPoints: [resolve(root, "src/index.ts")],
    external: ["clsx", "lucide-solid", "solid-js", "solid-js/web"],
    format: "esm",
    jsx: "automatic",
    jsxImportSource: "solid-js",
    outfile: resolve(dist, "index.js"),
    platform: "browser",
    plugins: [solidPlugin()],
    sourcemap: true,
    target: "chrome87",
  });

  await run("tsc", ["-p", "tsconfig.build.json"]);
  await buildCss();
}

await main();
