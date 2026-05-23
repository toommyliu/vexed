import { homedir } from "os";
import { isAbsolute, join, resolve } from "path";
import type { AppLaunchMode } from "../shared/settings";

export interface CliOptions {
  readonly launchMode?: AppLaunchMode;
  readonly username?: string;
  readonly password?: string;
  readonly server?: string;
  readonly scriptPath?: string;
  readonly flashPluginPath?: string;
}

type CliOptionName =
  | "flashPluginPath"
  | "launchMode"
  | "password"
  | "scriptPath"
  | "server"
  | "username";

const optionNames: Readonly<Record<string, CliOptionName>> = {
  "flash-plugin-path": "flashPluginPath",
  flashPath: "flashPluginPath",
  "launch-mode": "launchMode",
  launchMode: "launchMode",
  password: "password",
  script: "scriptPath",
  scriptPath: "scriptPath",
  server: "server",
  username: "username",
};

const valueRequiredOptionNames = new Set<CliOptionName>([
  "flashPluginPath",
  "launchMode",
  "password",
  "scriptPath",
  "server",
  "username",
]);

const trimOptional = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export const normalizeCliPath = (path: string, cwd = process.cwd()): string => {
  const trimmed = path.trim();
  if (trimmed.startsWith("~/") || trimmed === "~") {
    return join(homedir(), trimmed.slice(1));
  }

  return isAbsolute(trimmed) ? trimmed : resolve(cwd, trimmed);
};

const normalizeRequiredPath = (
  value: string | undefined,
  label: string,
  cwd: string,
): string => {
  const trimmed = trimOptional(value);
  if (trimmed === undefined) {
    throw new Error(`${label} is required`);
  }

  return normalizeCliPath(trimmed, cwd);
};

const normalizeLaunchMode = (value: string | undefined): AppLaunchMode => {
  const normalized = trimOptional(value)?.toLowerCase();
  if (normalized === "game") {
    return "game";
  }

  if (normalized === "manager" || normalized === "account-manager") {
    return "account-manager";
  }

  throw new Error(
    `Invalid --launchMode value: ${value ?? ""}. Expected game or manager.`,
  );
};

const readValue = (
  argv: readonly string[],
  index: number,
  optionName: CliOptionName,
  rawValue: string | undefined,
): { readonly value: string; readonly nextIndex: number } => {
  if (rawValue !== undefined) {
    return { value: rawValue, nextIndex: index };
  }

  if (!valueRequiredOptionNames.has(optionName)) {
    return { value: "", nextIndex: index };
  }

  const next = argv[index + 1];
  if (next === undefined || next.startsWith("--")) {
    throw new Error(`--${optionName} requires a value`);
  }

  return { value: next, nextIndex: index + 1 };
};

export const parseCliOptions = (
  argv: readonly string[],
  options: { readonly cwd?: string } = {},
): CliOptions => {
  const cwd = options.cwd ?? process.cwd();
  const output: {
    launchMode?: AppLaunchMode;
    username?: string;
    password?: string;
    server?: string;
    scriptPath?: string;
    flashPluginPath?: string;
  } = {};

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === undefined || !arg.startsWith("--")) {
      continue;
    }

    const source = arg.slice(2);
    const equalsIndex = source.indexOf("=");
    const key = equalsIndex === -1 ? source : source.slice(0, equalsIndex);
    const optionName = optionNames[key];
    if (optionName === undefined) {
      continue;
    }

    const rawValue =
      equalsIndex === -1 ? undefined : source.slice(equalsIndex + 1);
    const { value, nextIndex } = readValue(argv, index, optionName, rawValue);
    index = nextIndex;

    if (optionName === "launchMode") {
      output.launchMode = normalizeLaunchMode(value);
    } else if (optionName === "scriptPath") {
      output.scriptPath = normalizeRequiredPath(value, "--script", cwd);
    } else if (optionName === "flashPluginPath") {
      output.flashPluginPath = normalizeRequiredPath(value, "--flashPath", cwd);
    } else if (optionName === "server") {
      const server = trimOptional(value);
      if (server !== undefined) {
        output.server = server;
      }
    } else {
      const normalized = trimOptional(value);
      if (normalized !== undefined) {
        output[optionName] = normalized;
      }
    }
  }

  const hasUsername = output.username !== undefined;
  const hasPassword = output.password !== undefined;
  if (hasUsername !== hasPassword) {
    throw new Error(
      "Both --username and --password are required for CLI game launch.",
    );
  }

  if (output.scriptPath !== undefined && (!hasUsername || !hasPassword)) {
    throw new Error("--script requires --username and --password.");
  }

  return output;
};
