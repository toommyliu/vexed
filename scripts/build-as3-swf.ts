import fs from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { Console, Effect, Option } from "effect";
import { Argument, Command, Flag } from "effect/unstable/cli";

import { generateBridgeArtifacts } from "./gen-as3-bridge";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = join(SCRIPT_DIR, "..");
const DEFAULT_PROJECT_DIR = join(DEFAULT_REPO_ROOT, "as3");
const DEFAULT_OUTPUT_FILE = join(DEFAULT_REPO_ROOT, "assets", "loader.swf");

type AsconfigcModule = {
  buildWithArgs(args: string[]): Promise<void>;
};

type CliInput = {
  checkBridge: boolean;
  skipBridge: boolean;
  project: Option.Option<string>;
  sdk: Option.Option<string>;
  asconfigArgs: ReadonlyArray<string>;
};

const directoryExists = (path: string): Effect.Effect<boolean> =>
  Effect.tryPromise({
    try: () => fs.stat(path).then((stats) => stats.isDirectory()),
    catch: () => false,
  });

const resolveSdkFromVscodeSettings = (
  repoRoot: string
): Effect.Effect<string | null> =>
  Effect.gen(function* () {
    const settingsPath = join(repoRoot, ".vscode", "settings.json");

    const source = yield* Effect.tryPromise({
      try: () => fs.readFile(settingsPath, "utf8"),
      catch: () => "",
    });

    const match = source.match(/"as3mxml\.sdk\.framework"\s*:\s*"([^"]+)"/);
    if (!match || !match[1]) {
      return null;
    }

    const sdkPath = match[1];
    const exists = yield* directoryExists(sdkPath);
    if (exists) {
      return sdkPath;
    }

    return null;
  });

const resolveSdkPath = (repoRoot: string): Effect.Effect<string | null> =>
  Effect.gen(function* () {
    const envCandidates = [
      process.env.AS3_SDK,
      process.env.FLEX_HOME,
      process.env.ROYALE_HOME,
    ].filter((value): value is string => Boolean(value));

    for (const envCandidate of envCandidates) {
      const exists = yield* directoryExists(envCandidate);
      if (exists) {
        return envCandidate;
      }
    }

    return yield* resolveSdkFromVscodeSettings(repoRoot);
  });

const loadAsconfigc = (): Effect.Effect<AsconfigcModule> =>
  Effect.gen(function* () {
    const moduleNamespace = yield* Effect.tryPromise(() => import("asconfigc"));

    const fromDefault = (moduleNamespace as { default?: unknown }).default;
    const candidate = (fromDefault ?? moduleNamespace) as Partial<AsconfigcModule>;

    if (typeof candidate.buildWithArgs !== "function") {
      return yield* Effect.fail(
        new Error("Unable to load asconfigc.buildWithArgs()")
      );
    }

    return candidate as AsconfigcModule;
  });

const hasOption = (args: ReadonlyArray<string>, names: ReadonlyArray<string>): boolean => {
  for (const arg of args) {
    if (names.includes(arg)) {
      return true;
    }
    if (names.some((name) => arg.startsWith(`${name}=`))) {
      return true;
    }
  }
  return false;
};

const getOptionValue = (
  args: ReadonlyArray<string>,
  names: ReadonlyArray<string>
): string | null => {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (names.includes(arg)) {
      return args[index + 1] ?? null;
    }
    for (const name of names) {
      if (arg.startsWith(`${name}=`)) {
        return arg.slice(name.length + 1);
      }
    }
  }
  return null;
};

const stripOption = (
  args: ReadonlyArray<string>,
  names: ReadonlyArray<string>
): string[] => {
  const cleaned: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (names.includes(arg)) {
      index += 1;
      continue;
    }

    if (names.some((name) => arg.startsWith(`${name}=`))) {
      continue;
    }

    cleaned.push(arg);
  }

  return cleaned;
};

const resolveProjectPath = (repoRoot: string, asconfigArgs: ReadonlyArray<string>): string => {
  const projectArg = getOptionValue(asconfigArgs, ["-p", "--project"]);
  if (!projectArg) {
    return DEFAULT_PROJECT_DIR;
  }

  if (isAbsolute(projectArg)) {
    return projectArg;
  }

  return resolve(repoRoot, projectArg);
};

const resolveOutputPath = (projectPath: string): Effect.Effect<string> =>
  Effect.gen(function* () {
    const asconfigPath = join(projectPath, "asconfig.json");

    const configSource = yield* Effect.tryPromise({
      try: () => fs.readFile(asconfigPath, "utf8"),
      catch: () => "",
    });

    if (!configSource) {
      return DEFAULT_OUTPUT_FILE;
    }

    const parsed = yield* Effect.try({
      try: () => JSON.parse(configSource) as {
        compilerOptions?: { output?: string };
      },
      catch: () => ({ compilerOptions: {} }),
    });

    const configuredOutput = parsed.compilerOptions?.output;
    if (!configuredOutput) {
      return DEFAULT_OUTPUT_FILE;
    }

    return isAbsolute(configuredOutput)
      ? configuredOutput
      : resolve(projectPath, configuredOutput);
  });

const resolveAsconfigArgs = (input: CliInput, repoRoot: string): Effect.Effect<string[]> =>
  Effect.gen(function* () {
    let asconfigArgs = [...input.asconfigArgs];

    if (Option.isSome(input.project)) {
      asconfigArgs = stripOption(asconfigArgs, ["-p", "--project"]);
      asconfigArgs.unshift(input.project.value);
      asconfigArgs.unshift("-p");
    }
    else if (!hasOption(asconfigArgs, ["-p", "--project"])) {
      asconfigArgs.unshift(DEFAULT_PROJECT_DIR);
      asconfigArgs.unshift("-p");
    }

    if (Option.isSome(input.sdk)) {
      asconfigArgs = stripOption(asconfigArgs, ["--sdk"]);
      asconfigArgs.unshift(input.sdk.value);
      asconfigArgs.unshift("--sdk");
    }
    else if (!hasOption(asconfigArgs, ["--sdk"])) {
      const detectedSdkPath = yield* resolveSdkPath(repoRoot);
      if (detectedSdkPath) {
        asconfigArgs.unshift(detectedSdkPath);
        asconfigArgs.unshift("--sdk");
      }
    }

    return asconfigArgs;
  });

const main = (input: CliInput): Effect.Effect<void> =>
  Effect.gen(function* () {
    const repoRoot = DEFAULT_REPO_ROOT;
    process.chdir(repoRoot);

    const asconfigArgs = yield* resolveAsconfigArgs(input, repoRoot);

    const isHelpOrVersionRequest = hasOption(asconfigArgs, [
      "-h",
      "--help",
      "-v",
      "--version",
    ]);

    if (!input.skipBridge && !isHelpOrVersionRequest) {
      yield* Effect.tryPromise(() =>
        generateBridgeArtifacts({ check: input.checkBridge, repoRoot })
      );
    }

    const projectPath = resolveProjectPath(repoRoot, asconfigArgs);
    const outputPath = yield* resolveOutputPath(projectPath);

    const asconfigc = yield* loadAsconfigc();
    yield* Effect.tryPromise(() => asconfigc.buildWithArgs(asconfigArgs));

    if (!isHelpOrVersionRequest) {
      yield* Console.log(`Built ${relative(repoRoot, outputPath)}`);
    }
  });

const command = Command.make("build-as3-swf", {
  checkBridge: Flag.boolean("check-bridge").pipe(
    Flag.withDescription("Check if bridge artifacts are up to date")
  ),
  skipBridge: Flag.boolean("skip-bridge").pipe(
    Flag.withDescription("Skip bridge artifact generation")
  ),
  project: Flag.string("project").pipe(
    Flag.withAlias("p"),
    Flag.withDescription("AS3 project directory (defaults to ./as3)"),
    Flag.optional
  ),
  sdk: Flag.string("sdk").pipe(
    Flag.withDescription("AS3 SDK path (overrides auto-detection)"),
    Flag.optional
  ),
  asconfigArgs: Argument.string("asconfig-args").pipe(
    Argument.variadic(),
    Argument.withDescription(
      "Arguments forwarded to asconfigc (use `--` before passthrough flags)"
    )
  ),
}).pipe(
  Command.withHandler((input) => main(input))
);

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  Command.run(command, {
    version: "1.0.0",
  }).pipe(
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain
  );
}
