import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { Console, Data, Effect } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";
import { ChildProcess } from "effect/unstable/process";

const execFileAsync = promisify(execFile);

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");
const APP_PACKAGE_JSON_PATH = join(REPO_ROOT, "app", "package.json");
const STABLE_VERSION_PATTERN = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/;
const RELEASE_BRANCH = "main";
const RELEASE_FILES = ["app/package.json", "CHANGELOG.md"] as const;
const BUMP_KINDS = ["patch", "minor", "major"] as const;

type BumpKind = (typeof BUMP_KINDS)[number];

type Version = {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
};

type CliInput = {
  readonly bumpOrVersion: string;
  readonly dryRun: boolean;
  readonly allowDirty: boolean;
};

type AppPackageJson = {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly [key: string]: unknown;
};

class ReleaseError extends Data.TaggedError("ReleaseError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

const toErrorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

const toRelativePath = (path: string): string => {
  const value = relative(REPO_ROOT, path);
  return value === "" ? "." : value.split(sep).join("/");
};

const isBumpKind = (value: string): value is BumpKind =>
  BUMP_KINDS.includes(value as BumpKind);

const parseStableVersion = (value: string): Version | null => {
  const match = STABLE_VERSION_PATTERN.exec(value);
  if (!match) {
    return null;
  }

  const [, major, minor, patch] = match;
  if (major === undefined || minor === undefined || patch === undefined) {
    return null;
  }

  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
  };
};

const formatVersion = (version: Version): string =>
  `${version.major}.${version.minor}.${version.patch}`;

const compareVersions = (left: Version, right: Version): number => {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
};

const bumpVersion = (version: Version, bump: BumpKind): Version => {
  switch (bump) {
    case "patch":
      return { ...version, patch: version.patch + 1 };
    case "minor":
      return { major: version.major, minor: version.minor + 1, patch: 0 };
    case "major":
      return { major: version.major + 1, minor: 0, patch: 0 };
  }
};

const runGit = (
  args: ReadonlyArray<string>,
): Effect.Effect<string, ReleaseError> =>
  Effect.tryPromise({
    try: async () => {
      const { stdout } = await execFileAsync("git", [...args], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
      return stdout.trim();
    },
    catch: (cause) =>
      new ReleaseError({
        message: `git ${args.join(" ")} failed`,
        cause,
      }),
  });

const validateRepoRoot = (): Effect.Effect<void, ReleaseError> =>
  Effect.gen(function* () {
    const packageJsonPath = join(REPO_ROOT, "package.json");
    const source = yield* Effect.tryPromise({
      try: () => readFile(packageJsonPath, "utf8"),
      catch: (cause) =>
        new ReleaseError({
          message: `Failed to read ${toRelativePath(packageJsonPath)}`,
          cause,
        }),
    });

    const parsed = yield* Effect.try({
      try: () => JSON.parse(source) as { name?: unknown },
      catch: (cause) =>
        new ReleaseError({
          message: `Failed to parse ${toRelativePath(packageJsonPath)}`,
          cause,
        }),
    });

    if (parsed.name !== "vexed") {
      return yield* new ReleaseError({
        message: `Refusing to release from unexpected repo root: ${REPO_ROOT}`,
      });
    }
  });

const getCurrentBranch = (): Effect.Effect<string, ReleaseError> =>
  runGit(["branch", "--show-current"]).pipe(
    Effect.flatMap((branch) =>
      branch === ""
        ? Effect.fail(
            new ReleaseError({
              message: "Unable to determine current git branch",
            }),
          )
        : Effect.succeed(branch),
    ),
  );

const requireReleaseBranch = (branch: string) =>
  branch === RELEASE_BRANCH
    ? Effect.void
    : Effect.fail(
        new ReleaseError({
          message: `release must run from ${RELEASE_BRANCH}. Current branch is ${branch}.`,
        }),
      );

const getLatestStableTag = (): Effect.Effect<string, ReleaseError> =>
  runGit(["tag", "--merged", RELEASE_BRANCH, "--sort=-v:refname"]).pipe(
    Effect.flatMap((output) => {
      const tag = output
        .split(/\r?\n/)
        .map((value) => value.trim())
        .find((value) => STABLE_VERSION_PATTERN.test(value));

      return tag
        ? Effect.succeed(tag)
        : Effect.fail(
            new ReleaseError({
              message: `No stable semver tags found on ${RELEASE_BRANCH}`,
            }),
          );
    }),
  );

const readAppPackageJson = (): Effect.Effect<AppPackageJson, ReleaseError> =>
  Effect.gen(function* () {
    const source = yield* Effect.tryPromise({
      try: () => readFile(APP_PACKAGE_JSON_PATH, "utf8"),
      catch: (cause) =>
        new ReleaseError({
          message: `Failed to read ${toRelativePath(APP_PACKAGE_JSON_PATH)}`,
          cause,
        }),
    });

    return yield* Effect.try({
      try: () => JSON.parse(source) as AppPackageJson,
      catch: (cause) =>
        new ReleaseError({
          message: `Failed to parse ${toRelativePath(APP_PACKAGE_JSON_PATH)}`,
          cause,
        }),
    });
  });

const getAppVersion = (packageJson: AppPackageJson) =>
  typeof packageJson.version === "string"
    ? Effect.succeed(packageJson.version)
    : Effect.fail(
        new ReleaseError({
          message: `${toRelativePath(APP_PACKAGE_JSON_PATH)} is missing a string version`,
        }),
      );

const resolveTargetVersion = (
  bumpOrVersion: string,
  latestVersion: Version,
): Effect.Effect<string, ReleaseError> => {
  if (isBumpKind(bumpOrVersion)) {
    return Effect.succeed(
      formatVersion(bumpVersion(latestVersion, bumpOrVersion)),
    );
  }

  const parsed = parseStableVersion(bumpOrVersion);
  if (!parsed) {
    return Effect.fail(
      new ReleaseError({
        message:
          "Release version must be patch, minor, major, or a stable semver version like 0.9.0",
      }),
    );
  }

  if (compareVersions(parsed, latestVersion) <= 0) {
    return Effect.fail(
      new ReleaseError({
        message: `Target version ${bumpOrVersion} must be greater than latest release tag ${formatVersion(latestVersion)}`,
      }),
    );
  }

  return Effect.succeed(bumpOrVersion);
};

const tagExists = (tag: string): Effect.Effect<boolean, never> =>
  runGit(["rev-parse", "--verify", "--quiet", `refs/tags/${tag}`]).pipe(
    Effect.as(true),
    Effect.catch(() => Effect.succeed(false)),
  );

const requireNewTag = (tag: string) =>
  tagExists(tag).pipe(
    Effect.flatMap((exists) =>
      exists
        ? Effect.fail(
            new ReleaseError({ message: `Tag ${tag} already exists` }),
          )
        : Effect.void,
    ),
  );

const getDirtyStatus = (): Effect.Effect<ReadonlyArray<string>, ReleaseError> =>
  runGit(["status", "--porcelain"]).pipe(
    Effect.map((output) =>
      output === ""
        ? []
        : output.split(/\r?\n/).filter((line) => line.trim() !== ""),
    ),
  );

const checkDirtyTree = (
  dirtyStatus: ReadonlyArray<string>,
  input: CliInput,
): Effect.Effect<void, ReleaseError> =>
  Effect.gen(function* () {
    if (dirtyStatus.length === 0) {
      return;
    }

    if (!input.allowDirty) {
      return yield* new ReleaseError({
        message:
          "Working tree is dirty. Commit or stash changes, or rerun with --allow-dirty.",
      });
    }

    yield* Console.log("Working tree has existing changes:");
    for (const line of dirtyStatus) {
      yield* Console.log(`  ${line}`);
    }
  });

const writeAppVersion = (
  packageJson: AppPackageJson,
  targetVersion: string,
): Effect.Effect<void, ReleaseError> =>
  Effect.tryPromise({
    try: () =>
      writeFile(
        APP_PACKAGE_JSON_PATH,
        `${JSON.stringify({ ...packageJson, version: targetVersion }, null, 2)}\n`,
      ),
    catch: (cause) =>
      new ReleaseError({
        message: `Failed to write ${toRelativePath(APP_PACKAGE_JSON_PATH)}`,
        cause,
      }),
  });

const gitCliffArgs = (targetVersion: string): ReadonlyArray<string> => [
  "--config",
  "cliff.toml",
  "--tag",
  targetVersion,
  "--output",
  "CHANGELOG.md",
];

const runGitCliff = (targetVersion: string) =>
  Effect.gen(function* () {
    const child = yield* ChildProcess.make(
      "git-cliff",
      gitCliffArgs(targetVersion),
      {
        cwd: REPO_ROOT,
        env: process.env,
        extendEnv: true,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
        shell: process.platform === "win32",
        detached: false,
        forceKillAfter: "30 seconds",
      },
    );
    const exitCode = Number(yield* child.exitCode);

    if (exitCode !== 0) {
      return yield* new ReleaseError({
        message: `git-cliff exited with code ${exitCode}`,
      });
    }
  }).pipe(
    Effect.mapError((cause) =>
      cause instanceof ReleaseError
        ? cause
        : new ReleaseError({
            message: "git-cliff failed",
            cause,
          }),
    ),
    Effect.scoped,
  );

const printPlan = (
  branch: string,
  latestTag: string,
  appVersion: string,
  targetVersion: string,
): Effect.Effect<void> =>
  Effect.gen(function* () {
    yield* Console.log(`Current branch: ${branch}`);
    yield* Console.log(`Latest stable release tag: ${latestTag}`);
    yield* Console.log(`Current app/package.json version: ${appVersion}`);
    yield* Console.log(`Target version: ${targetVersion}`);
    yield* Console.log("Files that would change:");
    for (const file of RELEASE_FILES) {
      yield* Console.log(`  ${file}`);
    }
    yield* Console.log(
      `git-cliff command: git-cliff ${gitCliffArgs(targetVersion).join(" ")}`,
    );
  });

const printNextCommands = (targetVersion: string): Effect.Effect<void> =>
  Effect.gen(function* () {
    yield* Console.log("");
    yield* Console.log("Release files prepared. Next commands:");
    yield* Console.log("git diff -- app/package.json CHANGELOG.md");
    yield* Console.log("git add app/package.json CHANGELOG.md");
    yield* Console.log(`git commit -m "chore(release): ${targetVersion}"`);
    yield* Console.log(`git tag ${targetVersion}`);
    yield* Console.log("git push origin main");
    yield* Console.log(`git push origin ${targetVersion}`);
  });

const release = (input: CliInput) =>
  Effect.gen(function* () {
    yield* validateRepoRoot();

    const branch = yield* getCurrentBranch();
    yield* requireReleaseBranch(branch);

    const latestTag = yield* getLatestStableTag();
    const latestVersion = parseStableVersion(latestTag);
    if (!latestVersion) {
      return yield* new ReleaseError({
        message: `Latest release tag ${latestTag} is not stable semver`,
      });
    }

    const appPackageJson = yield* readAppPackageJson();
    const appVersion = yield* getAppVersion(appPackageJson);
    const targetVersion = yield* resolveTargetVersion(
      input.bumpOrVersion,
      latestVersion,
    );
    yield* requireNewTag(targetVersion);

    if (appVersion !== latestTag) {
      yield* Console.log(
        `Warning: app/package.json is ${appVersion} but latest release tag is ${latestTag}. Bumping from ${latestTag}.`,
      );
    }

    const dirtyStatus = yield* getDirtyStatus();
    yield* checkDirtyTree(dirtyStatus, input);

    if (input.dryRun) {
      yield* printPlan(branch, latestTag, appVersion, targetVersion);
      return;
    }

    yield* writeAppVersion(appPackageJson, targetVersion);
    yield* runGitCliff(targetVersion);
    yield* printNextCommands(targetVersion);
  });

const command = Command.make("release", {
  bumpOrVersion: Argument.string("bump-or-version").pipe(
    Argument.withDescription("patch, minor, major, or a stable semver version"),
  ),
  dryRun: Flag.boolean("dry-run").pipe(
    Flag.withDescription("Print the release plan without writing files"),
    Flag.withDefault(false),
  ),
  allowDirty: Flag.boolean("allow-dirty").pipe(
    Flag.withDescription(
      "Allow release prep with existing working tree changes",
    ),
    Flag.withDefault(false),
  ),
}).pipe(
  Command.withDescription("Prepare a Vexed release from main"),
  Command.withHandler(release),
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
    Effect.catch((error) =>
      Effect.gen(function* () {
        yield* error instanceof ReleaseError
          ? Console.error(`Release failed: ${error.message}`)
          : Console.error(`Release failed: ${toErrorMessage(error)}`);
        process.exitCode = 1;
      }),
    ),
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
