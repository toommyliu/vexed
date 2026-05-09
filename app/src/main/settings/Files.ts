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
import * as YAML from "yaml";

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

export const join = (...parts: readonly string[]): string =>
  joinPath(home(), "userdata", ...parts);

const YAML_PARSE_OPTIONS = {
  schema: "core",
  uniqueKeys: true,
  version: "1.2",
} as const;

const YAML_STRINGIFY_OPTIONS = {
  aliasDuplicateObjects: false,
  indent: 2,
  lineWidth: 0,
} as const;

const isYamlExplicitTag = (tag: unknown): boolean =>
  typeof tag === "string" && tag.length > 0;

const assertSafeYamlDocument = (document: YAML.Document.Parsed): void => {
  let unsafeReason: string | undefined;

  YAML.visit(document, (_key, node) => {
    if (node === null || typeof node !== "object") {
      return undefined;
    }

    if (YAML.isAlias(node)) {
      unsafeReason = "YAML aliases are not supported";
      return YAML.visit.BREAK;
    }

    if (isYamlExplicitTag((node as { readonly tag?: unknown }).tag)) {
      unsafeReason = "YAML tags are not supported";
      return YAML.visit.BREAK;
    }

    return undefined;
  });

  if (unsafeReason !== undefined) {
    throw new Error(unsafeReason);
  }
};

const parseYamlSource = (source: string): unknown => {
  const document = YAML.parseDocument(source, YAML_PARSE_OPTIONS);
  if (document.errors.length > 0) {
    throw document.errors[0];
  }

  assertSafeYamlDocument(document);
  return document.toJSON();
};

const readYamlFile = (path: string): unknown =>
  parseYamlSource(readFileSync(path, "utf8"));

export const readYaml = (path: string): unknown => {
  if (!existsSync(path)) {
    return undefined;
  }

  try {
    return readYamlFile(path);
  } catch {
    return undefined;
  }
};

const assertYamlSerializable = (
  value: unknown,
  ancestors = new WeakSet<object>(),
): void => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("YAML config values must be finite numbers");
    }
    return;
  }

  if (typeof value !== "object") {
    throw new Error("YAML config values must be JSON-compatible");
  }

  if (ancestors.has(value)) {
    throw new Error("YAML config values must not contain cycles");
  }

  ancestors.add(value);
  if (Array.isArray(value)) {
    for (const item of value) {
      assertYamlSerializable(item, ancestors);
    }
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new Error("YAML config objects must be plain objects");
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key.length === 0) {
        throw new Error("YAML config object keys must not be empty");
      }
      assertYamlSerializable(nestedValue, ancestors);
    }
  }
  ancestors.delete(value);
};

export const writeYaml = (path: string, value: unknown): void => {
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`;

  try {
    assertYamlSerializable(value);
    const source = YAML.stringify(value, YAML_STRINGIFY_OPTIONS);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(
      tempPath,
      source.endsWith("\n") ? source : `${source}\n`,
      "utf8",
    );
    renameSync(tempPath, path);
  } catch (cause) {
    try {
      unlinkSync(tempPath);
    } catch {}

    throw new WriteError({ path, cause });
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const deepEqual = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) {
    return true;
  }

  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => deepEqual(value, right[index]))
    );
  }

  if (!isRecord(left) || !isRecord(right)) {
    return false;
  }

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return (
    leftKeys.length === rightKeys.length &&
    leftKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(right, key) &&
        deepEqual(left[key], right[key]),
    )
  );
};

export const ensureYaml = <T>(
  path: string,
  defaults: T,
  normalize: (value: unknown) => T,
  serialize: (value: T) => unknown = (value) => value,
  shouldRewrite: (
    value: unknown,
    normalized: T,
    serialized: unknown,
  ) => boolean = (value, _normalized, serialized) =>
    !deepEqual(value, serialized),
): T => {
  const hasYaml = existsSync(path);
  const value = readYaml(path);
  const normalized = value === undefined ? defaults : normalize(value);
  const serialized = serialize(normalized);

  if (!hasYaml || value === undefined) {
    writeYaml(path, serialized);
    return normalized;
  }

  if (shouldRewrite(value, normalized, serialized)) {
    writeYaml(path, serialized);
  }

  return normalized;
};
