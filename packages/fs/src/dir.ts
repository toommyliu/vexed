import * as fs from "fs-extra";
import { totalist } from "totalist";
import { Result } from "better-result";
import { FsDeleteDirError, FsEnsureDirError, FsReadDirError } from "./errors";
import { isEnoentError } from "./util";

function stat(path: string) {
  return Result.tryPromise<fs.Stats, FsReadDirError>({
    try: () => fs.stat(path),
    catch: (cause: unknown) => new FsReadDirError({ path, cause }),
  });
}

/*
 * Ensures a directory exists, creating it if necessary.
 */
export async function ensureDir(
  path: string,
): Promise<Result<void, FsEnsureDirError>> {
  return Result.tryPromise({
    try: () => fs.ensureDir(path),
    catch: (cause: unknown) => new FsEnsureDirError({ path, cause }),
  });
}

/**
 * Deletes a directory and all of its contents if it exists.
 */
export async function deleteDir(
  path: string,
): Promise<Result<void, FsDeleteDirError | FsReadDirError>> {
  const result = await Result.gen(async function* () {
    const stats = yield* Result.await(stat(path));
    if (!stats.isDirectory()) {
      return Result.err(
        new FsDeleteDirError({
          path,
          cause: new Error("Path exists but is not a directory"),
        }),
      );
    }
    yield* Result.await(
      Result.tryPromise({
        try: () => fs.rm(path, { recursive: true, force: true }),
        catch: (cause: unknown) => new FsDeleteDirError({ path, cause }),
      }),
    );
    return Result.ok();
  });
  return result.match({
    ok: () => Result.ok(),
    err: (cause) => {
      if (isEnoentError(cause.cause)) return Result.ok();
      return Result.err(
        new FsDeleteDirError({
          path,
          cause,
        }),
      );
    },
  });
}

export interface ReadDirOptions {
  filter?: (
    name: string,
    absPath: string,
    stats: import("fs").Stats,
  ) => boolean;
  filesOnly?: boolean;
}

/**
 * Recursively reads all files in a directory and its subdirectories.
 */
export async function readDirRecursive(
  dirPath: string,
  options: ReadDirOptions = {},
): Promise<Result<string[], FsReadDirError>> {
  const { filter, filesOnly = true } = options;
  const results: string[] = [];
  return Result.tryPromise({
    try: async () => {
      await totalist(dirPath, (name, absPath, stats) => {
        if (filesOnly && !stats.isFile()) return;
        if (filter && !filter(name, absPath, stats)) return;
        results.push(absPath);
      });
      return results;
    },
    catch: (cause: unknown) => new FsReadDirError({ path: dirPath, cause }),
  });
}
