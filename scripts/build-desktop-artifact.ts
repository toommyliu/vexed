import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..");
const BUILD_PLATFORMS = ["mac", "win", "linux", "all"] as const;

type BuildPlatform = (typeof BUILD_PLATFORMS)[number];

class BuildDesktopArtifactError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BuildDesktopArtifactError";
  }
}

const isBuildPlatform = (value: string): value is BuildPlatform =>
  BUILD_PLATFORMS.includes(value as BuildPlatform);

const formatCommand = (
  command: string,
  args: ReadonlyArray<string>,
): string =>
  [command, ...args]
    .map((part) => (/\s/.test(part) ? JSON.stringify(part) : part))
    .join(" ");

const run = (
  command: string,
  args: ReadonlyArray<string>,
): Promise<void> => {
  console.log(`$ ${formatCommand(command, args)}`);

  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: REPO_ROOT,
      env: process.env,
      shell: process.platform === "win32",
      stdio: "inherit",
    });

    child.on("error", (cause) => {
      reject(
        new BuildDesktopArtifactError(
          `${formatCommand(command, args)} failed to start: ${cause.message}`,
        ),
      );
    });

    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason =
        signal === null ? `exit code ${code ?? "unknown"}` : `signal ${signal}`;
      reject(
        new BuildDesktopArtifactError(
          `${formatCommand(command, args)} failed with ${reason}`,
        ),
      );
    });
  });
};

const detectHostPlatform = (): BuildPlatform => {
  switch (process.platform) {
    case "darwin":
      return "mac";
    case "linux":
      return "linux";
    case "win32":
      return "win";
    default:
      throw new BuildDesktopArtifactError(
        `Unsupported host platform: ${process.platform}`,
      );
  }
};

const parsePlatform = (args: ReadonlyArray<string>): BuildPlatform => {
  let platform: BuildPlatform | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--platform") {
      const value = args[index + 1];
      if (!value || !isBuildPlatform(value)) {
        throw new BuildDesktopArtifactError(
          `Expected --platform to be one of: ${BUILD_PLATFORMS.join(", ")}`,
        );
      }

      platform = value;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--platform=")) {
      const value = arg.slice("--platform=".length);
      if (!isBuildPlatform(value)) {
        throw new BuildDesktopArtifactError(
          `Expected --platform to be one of: ${BUILD_PLATFORMS.join(", ")}`,
        );
      }

      platform = value;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      console.log(
        `Usage: tsx scripts/build-desktop-artifact.ts [--platform ${BUILD_PLATFORMS.join("|")}]\n`,
      );
      process.exit(0);
    }

    throw new BuildDesktopArtifactError(`Unknown argument: ${arg}`);
  }

  return platform ?? detectHostPlatform();
};

const electronBuilderArgs = (
  platform: BuildPlatform,
): ReadonlyArray<string> => {
  switch (platform) {
    case "all":
      return ["-mwl"];
    case "mac":
      return ["--mac"];
    case "win":
      return ["--win"];
    case "linux":
      return ["--linux"];
  }
};

const main = async (): Promise<void> => {
  const platform = parsePlatform(process.argv.slice(2));

  await run("pnpm", [
    "--filter",
    "@vexed/electron^...",
    "--if-present",
    "build",
  ]);
  await run("pnpm", ["--dir", "app", "build"]);
  await run("pnpm", [
    "--dir",
    "app",
    "electron-builder",
    ...electronBuilderArgs(platform),
  ]);
};

main().catch((cause) => {
  const message = cause instanceof Error ? cause.message : String(cause);
  console.error(`Desktop artifact build failed: ${message}`);
  process.exitCode = 1;
});
