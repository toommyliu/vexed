import * as fs from "fs-extra";
import { Result } from "better-result";
import * as lockfile from "proper-lockfile";
import {
  FsJsonParseError,
  FsJsonSerializeError,
  FsPathExistsError,
  FsWriteError,
  FsEnsureDirError,
  FsReadError,
  FsStatError,
  FsEnsureFileError,
} from "./errors";
import { readFile, writeFile } from "./file";

/**
 * Reads and parses a JSON file.
 */
export async function readJson<T = unknown>(
  path: string,
): Promise<Result<T, FsReadError | FsJsonParseError>> {
  return Result.gen(async function* () {
    const data = yield* Result.await(readFile(path, "utf8"));
    const parsed = yield* Result.try<T, FsJsonParseError>({
      try: () => JSON.parse(data),
      catch: (cause: unknown) => new FsJsonParseError({ path, cause }),
    });
    return Result.ok(parsed);
  });
}

/**
 * Writes data to a JSON file.
 */
export async function writeJson(
  path: string,
  data: unknown,
  indent = 2,
): Promise<
  Result<void, FsWriteError | FsEnsureDirError | FsJsonSerializeError>
> {
  return Result.gen(async function* () {
    const jsonString = yield* Result.try({
      try: () => JSON.stringify(data, null, indent),
      catch: (cause: unknown) => new FsJsonSerializeError({ path, cause }),
    });
    yield* Result.await(writeFile(path, jsonString, "utf8"));
    return Result.ok();
  });
}

/**
 * Ensures a JSON file exists with default content if it doesn't exist.
 */
export async function ensureJsonFile<T = unknown>(
  path: string,
  defaultContent: T,
  indent = 2,
): Promise<
  Result<
    void,
    | FsPathExistsError
    | FsWriteError
    | FsEnsureDirError
    | FsJsonSerializeError
    | FsStatError
    | FsEnsureFileError
  >
> {
  return Result.gen(async function* () {
    const release = yield* Result.await(
      Result.gen(async function* () {
        yield* Result.await(
          Result.tryPromise({
            try: () => fs.ensureFile(path),
            catch: (cause: unknown) => new FsEnsureFileError({ path, cause }),
          }),
        );
        return Result.tryPromise({
          try: () => lockfile.lock(path, { retries: 3, stale: 10000 }),
          catch: (cause: unknown) => new FsWriteError({ path, cause }),
        });
      }),
    );

    try {
      const stats = yield* Result.await(
        Result.tryPromise<fs.Stats, FsStatError>({
          try: () => fs.promises.stat(path),
          catch: (cause: unknown) => new FsStatError({ path, cause }),
        }),
      );
      if (stats.size === 0)
        yield* Result.await(writeJson(path, defaultContent, indent));
    } finally {
      if (typeof release === "function") {
        try {
          await release();
        } catch {}
      }
    }
    return Result.ok();
  });
}
