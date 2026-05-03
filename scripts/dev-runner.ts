import {
  readFileSync,
  rmSync,
  unwatchFile,
  watchFile,
  writeFileSync,
  type Stats,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { Console, Data, Effect, Queue, Ref } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { ChildProcess } from "effect/unstable/process";
import type { ChildProcessHandle } from "effect/unstable/process/ChildProcessSpawner";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");
const APP_DIR = join(REPO_ROOT, "app");
const DOCS_DIR = join(REPO_ROOT, "docs");
const DEV_BUILD_NOTIFY_PATH = join(APP_DIR, "dist", ".vexed-dev-build.json");
const DEV_RENDERER_RELOAD_PATH = join(
  APP_DIR,
  "dist",
  ".vexed-renderer-reload.json",
);
const RESTART_DEBOUNCE_MS = 300;
const FORCE_KILL_AFTER = "1500 millis";
const DEV_RUNNER_MODES = ["dev", "app", "docs"] as const;

type DevMode = (typeof DEV_RUNNER_MODES)[number];

type CliInput = {
  mode: DevMode;
  dryRun: boolean;
};

type DevBuildTarget = "main" | "preload" | "renderer" | "unknown";

type DevEvent =
  | {
      readonly _tag: "rebuild";
      readonly targets: ReadonlySet<DevBuildTarget>;
    }
  | {
      readonly _tag: "compile-watch-exit";
      readonly exitCode: number | null;
      readonly cause?: unknown;
    }
  | {
      readonly _tag: "electron-exit";
      readonly exitCode: number | null;
      readonly managed: boolean;
      readonly cause?: unknown;
    };

class DevRunnerError extends Data.TaggedError("DevRunnerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const toExitCodeNumber = (exitCode: unknown): number => Number(exitCode);

const createBaseEnv = (): NodeJS.ProcessEnv => ({
  ...process.env,
  NODE_ENV: "development",
});

const createWatchEnv = (): NodeJS.ProcessEnv => ({
  ...createBaseEnv(),
  VEXED_DEV_BUILD_NOTIFY: DEV_BUILD_NOTIFY_PATH,
  VEXED_DEV_BUILD_NOTIFY_SKIP_INITIAL: "1",
});

const createElectronEnv = (): NodeJS.ProcessEnv => ({
  ...createBaseEnv(),
  VEXED_DEV_RENDERER_RELOAD: DEV_RENDERER_RELOAD_PATH,
});

const childOptions = (
  cwd: string,
  env: NodeJS.ProcessEnv,
): ChildProcess.CommandOptions => ({
  cwd,
  env,
  extendEnv: false,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
  shell: process.platform === "win32",
  detached: false,
  forceKillAfter: FORCE_KILL_AFTER,
});

const spawnPnpm = (
  args: ReadonlyArray<string>,
  cwd: string,
  env: NodeJS.ProcessEnv,
) => ChildProcess.make("pnpm", args, childOptions(cwd, env));

const runRequiredCommand = (
  label: string,
  args: ReadonlyArray<string>,
  cwd: string,
  env: NodeJS.ProcessEnv,
) =>
  Effect.gen(function* () {
    const child = yield* spawnPnpm(args, cwd, env);
    const exitCode = yield* child.exitCode;
    const numericExitCode = toExitCodeNumber(exitCode);

    if (numericExitCode !== 0) {
      return yield* new DevRunnerError({
        message: `${label} exited with code ${numericExitCode}`,
      });
    }
  }).pipe(
    Effect.mapError((cause) =>
      cause instanceof DevRunnerError
        ? cause
        : new DevRunnerError({
            message: `${label} failed`,
            cause,
          }),
    ),
  );

const stopChild = (label: string, child: ChildProcessHandle) =>
  Effect.gen(function* () {
    const running = yield* child.isRunning.pipe(
      Effect.catch(() => Effect.succeed(false)),
    );

    if (!running) {
      return;
    }

    yield* child
      .kill({
        killSignal: "SIGTERM",
        forceKillAfter: FORCE_KILL_AFTER,
      })
      .pipe(
        Effect.catch((cause) =>
          Console.error(
            `[dev-runner] failed to stop ${label}: ${String(cause)}`,
          ),
        ),
      );
  });

const isRendererOnlyRebuild = (targets: ReadonlySet<DevBuildTarget>): boolean =>
  targets.size > 0 && [...targets].every((target) => target === "renderer");

const toDevBuildTarget = (label: unknown): DevBuildTarget => {
  switch (label) {
    case "main":
      return "main";
    case "preload":
      return "preload";
    case "renderer":
    case "renderer-html":
      return "renderer";
    default:
      return "unknown";
  }
};

const readDevBuildTargets = (
  offset: number,
): {
  readonly offset: number;
  readonly targets: ReadonlyArray<DevBuildTarget>;
} => {
  try {
    const content = readFileSync(DEV_BUILD_NOTIFY_PATH, "utf8");
    const nextOffset = content.length;
    const unreadContent = content.slice(Math.min(offset, nextOffset));

    if (unreadContent.trim() === "") {
      return { offset: nextOffset, targets: [] };
    }

    return {
      offset: nextOffset,
      targets: unreadContent
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          try {
            const payload = JSON.parse(line) as { label?: unknown };
            return toDevBuildTarget(payload.label);
          } catch {
            return "unknown";
          }
        }),
    };
  } catch {
    return { offset: 0, targets: ["unknown"] };
  }
};

const installNotifyWatcher = (events: Queue.Queue<DevEvent>) =>
  Effect.sync(() => {
    let debounceTimer: NodeJS.Timeout | undefined;
    let pendingTargets = new Set<DevBuildTarget>();
    let notifyOffset = 0;

    const queueRebuild = (targets: ReadonlyArray<DevBuildTarget>) => {
      for (const target of targets) {
        pendingTargets.add(target);
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        const targets = pendingTargets;
        pendingTargets = new Set<DevBuildTarget>();
        Effect.runFork(Queue.offer(events, { _tag: "rebuild", targets }));
      }, RESTART_DEBOUNCE_MS);
    };

    const listener = (current: Stats, previous: Stats) => {
      if (
        current.mtimeMs === previous.mtimeMs &&
        current.size === previous.size
      ) {
        return;
      }

      if (current.mtimeMs === 0) {
        return;
      }

      const result = readDevBuildTargets(notifyOffset);
      notifyOffset = result.offset;
      queueRebuild(result.targets);
    };

    rmSync(DEV_BUILD_NOTIFY_PATH, { force: true });
    rmSync(DEV_RENDERER_RELOAD_PATH, { force: true });
    watchFile(DEV_BUILD_NOTIFY_PATH, { interval: 250 }, listener);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      unwatchFile(DEV_BUILD_NOTIFY_PATH, listener);
    };
  }).pipe(
    Effect.flatMap((cleanup) =>
      Effect.addFinalizer(() => Effect.sync(cleanup)),
    ),
  );

const reloadRendererWindows = Effect.sync(() => {
  writeFileSync(
    DEV_RENDERER_RELOAD_PATH,
    `${JSON.stringify({
      pid: process.pid,
      time: Date.now(),
    })}\n`,
  );
});

const watchCompileExit = (
  events: Queue.Queue<DevEvent>,
  compileWatch: ChildProcessHandle,
) =>
  compileWatch.exitCode.pipe(
    Effect.matchEffect({
      onFailure: (cause) =>
        Queue.offer(events, {
          _tag: "compile-watch-exit",
          exitCode: null,
          cause,
        }),
      onSuccess: (exitCode) =>
        Queue.offer(events, {
          _tag: "compile-watch-exit",
          exitCode: toExitCodeNumber(exitCode),
        }),
    }),
  );

const watchElectronExit = (
  events: Queue.Queue<DevEvent>,
  restartingElectron: Ref.Ref<boolean>,
  electron: ChildProcessHandle,
) =>
  electron.exitCode.pipe(
    Effect.matchEffect({
      onFailure: (cause) =>
        Effect.gen(function* () {
          const managed = yield* Ref.get(restartingElectron);
          yield* Queue.offer(events, {
            _tag: "electron-exit",
            exitCode: null,
            managed,
            cause,
          });
        }),
      onSuccess: (exitCode) =>
        Effect.gen(function* () {
          const managed = yield* Ref.get(restartingElectron);
          yield* Queue.offer(events, {
            _tag: "electron-exit",
            exitCode: toExitCodeNumber(exitCode),
            managed,
          });
        }),
    }),
  );

const runDevLoop = () =>
  Effect.gen(function* () {
    const baseEnv = createBaseEnv();
    const electronEnv = createElectronEnv();
    const watchEnv = createWatchEnv();

    yield* Console.log("[dev-runner] building app");
    yield* runRequiredCommand("initial compile", ["compile"], APP_DIR, baseEnv);

    const events = yield* Queue.make<DevEvent>();
    const restartingElectron = yield* Ref.make(false);
    const activeElectron = yield* Ref.make<ChildProcessHandle | null>(null);

    yield* installNotifyWatcher(events);

    yield* Console.log("[dev-runner] starting compile watcher");
    const compileWatch = yield* spawnPnpm(["compile:watch"], APP_DIR, watchEnv);
    yield* Effect.forkScoped(watchCompileExit(events, compileWatch));

    const startElectron = Effect.gen(function* () {
      yield* Console.log("[dev-runner] starting electron");
      const electron = yield* spawnPnpm(["electron"], APP_DIR, electronEnv);
      yield* Ref.set(activeElectron, electron);
      yield* Effect.forkScoped(
        watchElectronExit(events, restartingElectron, electron),
      );
    });

    const stopActiveElectron = Effect.gen(function* () {
      const electron = yield* Ref.get(activeElectron);
      if (!electron) {
        return;
      }

      yield* stopChild("electron", electron);
      yield* Ref.set(activeElectron, null);
    });

    yield* startElectron;

    while (true) {
      const event = yield* Queue.take(events);

      switch (event._tag) {
        case "rebuild": {
          if (isRendererOnlyRebuild(event.targets)) {
            yield* Console.log(
              "[dev-runner] renderer rebuild detected; reloading windows",
            );
            yield* reloadRendererWindows;
            break;
          }

          yield* Console.log(
            "[dev-runner] rebuild detected; restarting electron",
          );
          yield* Ref.set(restartingElectron, true);
          yield* stopActiveElectron.pipe(
            Effect.ensuring(Ref.set(restartingElectron, false)),
          );
          yield* startElectron;
          break;
        }

        case "compile-watch-exit": {
          yield* stopActiveElectron;
          return yield* new DevRunnerError({
            message:
              event.exitCode === null
                ? "compile watcher exited before reporting an exit code"
                : `compile watcher exited with code ${event.exitCode}`,
            cause: event.cause,
          });
        }

        case "electron-exit": {
          if (event.managed) {
            break;
          }

          yield* stopChild("compile watcher", compileWatch);

          if (event.exitCode === 0) {
            return;
          }

          return yield* new DevRunnerError({
            message:
              event.exitCode === null
                ? "electron exited before reporting an exit code"
                : `electron exited with code ${event.exitCode}`,
            cause: event.cause,
          });
        }
      }
    }
  }).pipe(Effect.scoped);

const runDocsLoop = () =>
  Effect.gen(function* () {
    yield* Console.log("[dev-runner] starting docs");
    yield* runRequiredCommand(
      "docs dev server",
      ["dev"],
      DOCS_DIR,
      createBaseEnv(),
    );
  }).pipe(Effect.scoped);

const runDefaultDevLoop = () =>
  Effect.race(runDevLoop(), runDocsLoop()).pipe(
    Effect.mapError((cause) =>
      cause instanceof DevRunnerError
        ? cause
        : new DevRunnerError({
            message: "default dev loop failed",
            cause,
          }),
    ),
  );

const dryRun = (mode: DevMode) =>
  Effect.gen(function* () {
    yield* Console.log("[dev-runner] dry run");
    yield* Console.log(`mode=${mode}`);
    yield* Console.log(`repoRoot=${REPO_ROOT}`);
    yield* Console.log("env.NODE_ENV=development");

    if (mode === "dev" || mode === "app") {
      yield* Console.log(`appDir=${APP_DIR}`);
      yield* Console.log(`notifyFile=${DEV_BUILD_NOTIFY_PATH}`);
      yield* Console.log(`rendererReloadFile=${DEV_RENDERER_RELOAD_PATH}`);
      yield* Console.log("app.initial=pnpm compile");
      yield* Console.log("app.watch=pnpm compile:watch");
      yield* Console.log("app.electron=pnpm electron");
      yield* Console.log(`env.VEXED_DEV_BUILD_NOTIFY=${DEV_BUILD_NOTIFY_PATH}`);
      yield* Console.log("env.VEXED_DEV_BUILD_NOTIFY_SKIP_INITIAL=1");
      yield* Console.log(
        `env.VEXED_DEV_RENDERER_RELOAD=${DEV_RENDERER_RELOAD_PATH}`,
      );
    }

    if (mode === "dev" || mode === "docs") {
      yield* Console.log(`docsDir=${DOCS_DIR}`);
      yield* Console.log("docs=pnpm dev");
    }
  });

const runDevRunner = (input: CliInput) => {
  if (input.dryRun) {
    return dryRun(input.mode);
  }

  switch (input.mode) {
    case "dev":
      return runDefaultDevLoop();
    case "app":
      return runDevLoop();
    case "docs":
      return runDocsLoop();
  }
};

const command = Command.make("dev-runner", {
  mode: Argument.choice("mode", DEV_RUNNER_MODES).pipe(
    Argument.withDescription("Development mode to run"),
  ),
  dryRun: Flag.boolean("dry-run").pipe(
    Flag.withDescription("Print resolved dev commands without spawning them"),
    Flag.withDefault(false),
  ),
}).pipe(
  Command.withDescription("Run Vexed development modes"),
  Command.withHandler(runDevRunner),
);

const getCliArgs = (): ReadonlyArray<string> =>
  process.argv.slice(2).filter((arg) => arg !== "--");

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  Command.runWith(command, {
    version: "1.0.0",
  })(getCliArgs()).pipe(
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
