import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "fs";
import { homedir } from "os";
import { dirname, join as joinPath } from "path";

export class WriteError extends Error {
  readonly path: string;
  override readonly cause: unknown;

  constructor(args: { readonly path: string; readonly cause: unknown }) {
    super(`Failed to write file: ${args.path}`);
    this.name = "Files.WriteError";
    this.path = args.path;
    this.cause = args.cause;
  }
}

export const home = (env: NodeJS.ProcessEnv = process.env): string => {
  const configuredHome = env["VEXED_HOME"]?.trim();
  return configuredHome && configuredHome.length > 0
    ? configuredHome
    : joinPath(homedir(), ".vexed");
};

export const join = (
  ...parts: readonly string[]
): string => joinPath(home(), "userdata", ...parts);

export const readJson = (path: string): unknown => {
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
};

export const writeJson = (path: string, value: unknown): void => {
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;

  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    renameSync(tempPath, path);
  } catch (cause) {
    try {
      unlinkSync(tempPath);
    } catch {}

    throw new WriteError({ path, cause });
  }
};

export const ensureJson = <T>(
  path: string,
  defaults: T,
  normalize: (value: unknown) => T,
): T => {
  if (existsSync(path)) {
    const value = readJson(path);
    const normalized = normalize(value);

    if (value === undefined) {
      writeJson(path, normalized);
    }

    return normalized;
  }

  writeJson(path, defaults);
  return defaults;
};
