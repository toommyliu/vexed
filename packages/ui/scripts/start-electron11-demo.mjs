import { spawn } from "node:child_process";
import { get } from "node:http";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(__dirname, "..");
const demoMainPath = resolve(packageRoot, "demo/electron/main.cjs");
const demoHost = "127.0.0.1";
const demoPort = 4173;
const readyTimeoutMs = 30_000;
const readyPollMs = 250;
const children = new Set();

function spawnChild(command, args, options) {
  const { stdio = "inherit", ...spawnOptions } = options;
  const child = spawn(command, args, {
    ...spawnOptions,
    shell: process.platform === "win32",
    stdio,
  });

  children.add(child);
  child.once("error", () => children.delete(child));
  child.once("exit", () => children.delete(child));

  return child;
}

function stopChild(child) {
  if (child.exitCode !== null || child.killed) {
    return;
  }

  child.kill("SIGTERM");
}

function stopChildren() {
  for (const child of children) {
    stopChild(child);
  }
}

function toSignalExitCode(signal) {
  switch (signal) {
    case "SIGINT":
      return 130;
    case "SIGTERM":
      return 143;
    default:
      return 1;
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    stopChildren();
    process.exit(toSignalExitCode(signal));
  });
}

function waitForChild(child) {
  return new Promise((resolvePromise, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      resolvePromise({ code, signal });
    });
  });
}

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

function requestReady(url) {
  return new Promise((resolvePromise) => {
    const request = get(url, (response) => {
      response.resume();
      resolvePromise(
        response.statusCode !== undefined &&
          response.statusCode >= 200 &&
          response.statusCode < 500,
      );
    });

    request.setTimeout(1_000, () => {
      request.destroy();
      resolvePromise(false);
    });
    request.once("error", () => resolvePromise(false));
  });
}

function waitForViteUrl(child) {
  return new Promise((resolvePromise, reject) => {
    let output = "";
    let settled = false;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for Vite to print its local URL"));
    }, readyTimeoutMs);

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onData);
    };

    const onData = (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(chunk);

      const match = output.match(/https?:\/\/127\.0\.0\.1:\d+\//);
      if (!match || settled) {
        return;
      }

      cleanup();
      resolvePromise(match[0]);
    };

    child.stdout?.on("data", onData);
    child.stderr?.on("data", onData);
  });
}

async function waitForServer(url, isRunning) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < readyTimeoutMs) {
    if (!isRunning()) {
      throw new Error(`Vite demo server exited before ${url} became ready`);
    }

    if (await requestReady(url)) {
      return;
    }

    await sleep(readyPollMs);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  console.log(
    `[ui-demo-electron11] starting UI demo on ${demoHost}:${demoPort}`,
  );
  const vite = spawnChild(
    "pnpm",
    [
      "exec",
      "vite",
      "--config",
      "vite.demo.config.ts",
      "--host",
      demoHost,
      "--port",
      String(demoPort),
    ],
    {
      cwd: packageRoot,
      stdio: ["inherit", "pipe", "pipe"],
    },
  );

  let viteExit = null;
  const viteExitPromise = waitForChild(vite).then((result) => {
    viteExit = result;
    return result;
  });

  const uiDemoUrl = await Promise.race([
    waitForViteUrl(vite),
    viteExitPromise.then((nextViteExit) => {
      throw new Error(
        nextViteExit.signal
          ? `Vite demo server exited after ${nextViteExit.signal}`
          : `Vite demo server exited with code ${nextViteExit.code}`,
      );
    }),
  ]);

  await waitForServer(uiDemoUrl, () => viteExit === null);

  console.log(`[ui-demo-electron11] launching Electron 11 at ${uiDemoUrl}`);
  const electron = spawnChild(require("electron"), [demoMainPath, uiDemoUrl], {
    cwd: packageRoot,
  });

  const electronExitPromise = waitForChild(electron);
  const result = await Promise.race([
    electronExitPromise.then((electronExit) => ({ electronExit })),
    viteExitPromise.then((nextViteExit) => ({ viteExit: nextViteExit })),
  ]);

  if ("viteExit" in result) {
    stopChild(electron);
    await Promise.race([electronExitPromise, sleep(1_500)]);
    throw new Error(
      result.viteExit.signal
        ? `Vite demo server exited after ${result.viteExit.signal}`
        : `Vite demo server exited with code ${result.viteExit.code}`,
    );
  }

  stopChild(vite);
  await Promise.race([viteExitPromise, sleep(1_500)]);

  if (result.electronExit.signal) {
    process.kill(process.pid, result.electronExit.signal);
    return;
  }

  process.exit(result.electronExit.code ?? 0);
}

main().catch((error) => {
  stopChildren();
  console.error("[ui-demo-electron11] failed:", error);
  process.exit(1);
});
