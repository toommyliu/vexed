import { readdir, readFile, rm } from "node:fs/promises";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { Console, Data, Effect } from "effect";
import { Command, Flag } from "effect/unstable/cli";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");
const CLEAN_DIRECTORY_NAMES = new Set(["node_modules", "dist", "build"]);

type CliInput = {
  dryRun: boolean;
};

class CleanError extends Data.TaggedError("CleanError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const toErrorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

const toRelativePath = (path: string): string => {
  const value = relative(REPO_ROOT, path);
  return value === "" ? "." : value.split(sep).join("/");
};

const validateRepoRoot = (): Effect.Effect<void, CleanError> =>
  Effect.gen(function* () {
    const packageJsonPath = join(REPO_ROOT, "package.json");
    const source = yield* Effect.tryPromise({
      try: () => readFile(packageJsonPath, "utf8"),
      catch: (cause) =>
        new CleanError({
          message: `Failed to read ${toRelativePath(packageJsonPath)}`,
          cause,
        }),
    });

    const parsed = yield* Effect.try({
      try: () => JSON.parse(source) as { name?: unknown },
      catch: (cause) =>
        new CleanError({
          message: `Failed to parse ${toRelativePath(packageJsonPath)}`,
          cause,
        }),
    });

    if (parsed.name !== "vexed") {
      return yield* new CleanError({
        message: `Refusing to clean unexpected repo root: ${REPO_ROOT}`,
      });
    }
  });

const findCleanTargets = (): Effect.Effect<ReadonlyArray<string>, CleanError> =>
  Effect.gen(function* () {
    const targets: string[] = [];

    const visit = (directory: string): Effect.Effect<void, CleanError> =>
      Effect.gen(function* () {
        const entries = yield* Effect.tryPromise({
          try: () => readdir(directory, { withFileTypes: true }),
          catch: (cause) =>
            new CleanError({
              message: `Failed to read directory ${toRelativePath(directory)}`,
              cause,
            }),
        });

        for (const entry of entries) {
          if (entry.name === ".git") {
            continue;
          }

          if (!entry.isDirectory() || entry.isSymbolicLink()) {
            continue;
          }

          const path = join(directory, entry.name);
          if (CLEAN_DIRECTORY_NAMES.has(basename(path))) {
            targets.push(path);
            continue;
          }

          yield* visit(path);
        }
      });

    yield* visit(REPO_ROOT);

    return targets.sort((left, right) =>
      toRelativePath(left).localeCompare(toRelativePath(right)),
    );
  });

const deleteTarget = (path: string): Effect.Effect<void, CleanError> =>
  Effect.tryPromise({
    try: () => rm(path, { recursive: true, force: true }),
    catch: (cause) =>
      new CleanError({
        message: `Failed to delete ${toRelativePath(path)}`,
        cause,
      }),
  });

const clean = (input: CliInput): Effect.Effect<void, CleanError> =>
  Effect.gen(function* () {
    yield* validateRepoRoot();
    const targets = yield* findCleanTargets();

    if (targets.length === 0) {
      yield* Console.log("Clean complete. No generated directories found.");
      return;
    }

    if (input.dryRun) {
      for (const target of targets) {
        yield* Console.log(`Would delete: ${toRelativePath(target)}`);
      }
      yield* Console.log(
        `Clean dry run complete. ${targets.length} path(s) matched.`,
      );
      return;
    }

    for (const target of targets) {
      yield* Console.log(`Deleting: ${toRelativePath(target)}`);
      yield* deleteTarget(target);
    }

    yield* Console.log(`Clean complete. ${targets.length} path(s) deleted.`);
  });

const command = Command.make("clean", {
  dryRun: Flag.boolean("dry-run").pipe(
    Flag.withDescription(
      "Print paths that would be deleted without removing them",
    ),
    Flag.withDefault(false),
  ),
}).pipe(
  Command.withDescription("Remove generated directories from the repository"),
  Command.withHandler(clean),
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
    Effect.tapError((error) =>
      error instanceof CleanError
        ? Console.error(`Clean failed: ${error.message}`)
        : Console.error(`Clean failed: ${toErrorMessage(error)}`),
    ),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
