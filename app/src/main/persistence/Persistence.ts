import { promises as fs } from "fs";
import { dirname } from "path";
import * as YAML from "yaml";
import { Data, Effect, Layer, ServiceMap } from "effect";
import { makeRandomId } from "../../shared/random-id";

export class PersistenceError extends Data.TaggedError("PersistenceError")<{
  readonly path: string;
  readonly operation: "read" | "write" | "rename" | "mkdir" | "unlink";
  readonly cause: unknown;
}> {}

export class DocumentParseError extends Data.TaggedError("DocumentParseError")<{
  readonly path: string;
  readonly format: "json" | "yaml";
  readonly cause: unknown;
}> {}

export type DocumentReadResult =
  | { readonly status: "missing" }
  | { readonly status: "malformed"; readonly error: DocumentParseError }
  | { readonly status: "ok"; readonly value: unknown };

export interface PersistenceShape {
  readonly readText: (
    path: string,
  ) => Effect.Effect<string | undefined, PersistenceError>;
  readonly writeTextAtomic: (
    path: string,
    source: string,
  ) => Effect.Effect<void, PersistenceError>;
  readonly readJson: (
    path: string,
  ) => Effect.Effect<DocumentReadResult, PersistenceError>;
  readonly writeJson: (
    path: string,
    value: unknown,
  ) => Effect.Effect<void, PersistenceError>;
  readonly readYaml: (
    path: string,
  ) => Effect.Effect<DocumentReadResult, PersistenceError>;
  readonly writeYaml: (
    path: string,
    value: unknown,
  ) => Effect.Effect<void, PersistenceError>;
  readonly quarantineMalformed: (
    path: string,
    reason: string,
  ) => Effect.Effect<string | null, PersistenceError>;
}

export class Persistence extends ServiceMap.Service<
  Persistence,
  PersistenceShape
>()("main/Persistence") {}

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

export const parseYamlSource = (source: string): unknown => {
  const document = YAML.parseDocument(source, YAML_PARSE_OPTIONS);
  if (document.errors.length > 0) {
    throw document.errors[0];
  }

  assertSafeYamlDocument(document);
  return document.toJSON();
};

const stringifyJson = (
  path: string,
  value: unknown,
): Effect.Effect<string, PersistenceError> =>
  Effect.try({
    try: () => {
      const source = JSON.stringify(value, null, 2);
      if (source === undefined) {
        throw new Error("Value is not JSON serializable");
      }
      return `${source}\n`;
    },
    catch: (cause) => new PersistenceError({ path, operation: "write", cause }),
  });

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

const withTrailingNewline = (source: string): string =>
  source.endsWith("\n") ? source : `${source}\n`;

const makePersistenceError = (
  path: string,
  operation: PersistenceError["operation"],
  cause: unknown,
) => new PersistenceError({ path, operation, cause });

export const makePersistence = (): PersistenceShape => {
  const readText: PersistenceShape["readText"] = (path) =>
    Effect.tryPromise({
      try: async () => {
        try {
          return await fs.readFile(path, "utf8");
        } catch (cause) {
          if (
            typeof cause === "object" &&
            cause !== null &&
            (cause as { readonly code?: unknown }).code === "ENOENT"
          ) {
            return undefined;
          }
          throw cause;
        }
      },
      catch: (cause) => {
        return makePersistenceError(path, "read", cause);
      },
    });

  const writeTextAtomic: PersistenceShape["writeTextAtomic"] = (
    path,
    source,
  ) => {
    const tempPath = `${path}.${process.pid}.${makeRandomId()}.tmp`;

    return Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: () => fs.mkdir(dirname(path), { recursive: true }),
        catch: (cause) => makePersistenceError(path, "mkdir", cause),
      });

      yield* Effect.tryPromise({
        try: () => fs.writeFile(tempPath, source, "utf8"),
        catch: (cause) => makePersistenceError(tempPath, "write", cause),
      }).pipe(
        Effect.catch((error: PersistenceError) =>
          Effect.tryPromise({
            try: () => fs.unlink(tempPath),
            catch: (cause) => makePersistenceError(tempPath, "unlink", cause),
          }).pipe(
            Effect.catch(() => Effect.void),
            Effect.flatMap(() => Effect.fail(error)),
          ),
        ),
      );

      yield* Effect.tryPromise({
        try: () => fs.rename(tempPath, path),
        catch: (cause) => makePersistenceError(path, "rename", cause),
      }).pipe(
        Effect.catch((error: PersistenceError) =>
          Effect.tryPromise({
            try: () => fs.unlink(tempPath),
            catch: (cause) => makePersistenceError(tempPath, "unlink", cause),
          }).pipe(
            Effect.catch(() => Effect.void),
            Effect.flatMap(() => Effect.fail(error)),
          ),
        ),
      );
    });
  };

  const readJson: PersistenceShape["readJson"] = (path) =>
    Effect.gen(function* () {
      const source = yield* readText(path);
      if (source === undefined) {
        return { status: "missing" } as const;
      }

      try {
        return { status: "ok", value: JSON.parse(source) as unknown } as const;
      } catch (cause) {
        return {
          status: "malformed",
          error: new DocumentParseError({ path, format: "json", cause }),
        } as const;
      }
    });

  const writeJson: PersistenceShape["writeJson"] = (path, value) =>
    stringifyJson(path, value).pipe(
      Effect.flatMap((source) => writeTextAtomic(path, source)),
    );

  const readYaml: PersistenceShape["readYaml"] = (path) =>
    Effect.gen(function* () {
      const source = yield* readText(path);
      if (source === undefined) {
        return { status: "missing" } as const;
      }

      try {
        return { status: "ok", value: parseYamlSource(source) } as const;
      } catch (cause) {
        return {
          status: "malformed",
          error: new DocumentParseError({ path, format: "yaml", cause }),
        } as const;
      }
    });

  const writeYaml: PersistenceShape["writeYaml"] = (path, value) => {
    try {
      assertYamlSerializable(value);
      return writeTextAtomic(
        path,
        withTrailingNewline(YAML.stringify(value, YAML_STRINGIFY_OPTIONS)),
      );
    } catch (cause) {
      return Effect.fail(makePersistenceError(path, "write", cause));
    }
  };

  const quarantineMalformed: PersistenceShape["quarantineMalformed"] = (
    path,
    reason,
  ) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const quarantinePath = `${path}.corrupt-${timestamp}-${makeRandomId()}`;

    return Effect.tryPromise({
      try: async () => {
        try {
          await fs.rename(path, quarantinePath);
          return quarantinePath;
        } catch (cause) {
          if (
            typeof cause === "object" &&
            cause !== null &&
            (cause as { readonly code?: unknown }).code === "ENOENT"
          ) {
            return null;
          }
          throw cause;
        }
      },
      catch: (cause) => {
        return makePersistenceError(path, "rename", { reason, cause });
      },
    });
  };

  return {
    readText,
    writeTextAtomic,
    readJson,
    writeJson,
    readYaml,
    writeYaml,
    quarantineMalformed,
  };
};

export const PersistenceLive = Layer.succeed(Persistence, makePersistence());
