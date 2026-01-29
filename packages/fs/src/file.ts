import { dirname } from "path";
import * as atomically from "atomically";
import * as fs from "fs-extra";
import * as lockfile from "proper-lockfile";
import { Result } from "better-result";
import {
  FsAppendError,
  FsDeleteFileError,
  FsEnsureDirError,
  FsEnsureFileError,
  FsPathExistsError,
  FsReadError,
  FsStatError,
  FsWriteError,
} from "./errors";
import { ensureDir } from "./dir";
import { isEnoentError } from "./util";

/**
 * Checks if a file or directory exists.
 */
export async function pathExists(
  path: string,
): Promise<Result<boolean, FsPathExistsError>> {
  return Result.tryPromise({
    try: () => fs.pathExists(path),
    catch: (cause: unknown) => new FsPathExistsError({ path, cause }),
  });
}

/**
 * Reads the contents of a file.
 */
export async function readFile(
  path: string,
  encoding: BufferEncoding = "utf8",
): Promise<Result<string, FsReadError>> {
  return Result.tryPromise({
    try: () => atomically.readFile(path, encoding),
    catch: (cause: unknown) => new FsReadError({ path, cause }),
  });
}

/**
 * Writes data to a file, ensuring the directory exists.
 */
export async function writeFile(
  path: string,
  data: string | Buffer,
  encoding: BufferEncoding = "utf8",
): Promise<Result<void, FsWriteError | FsEnsureDirError>> {
  return Result.gen(async function* () {
    yield* Result.await(ensureDir(dirname(path)));
    yield* Result.await(
      Result.tryPromise({
        try: () => atomically.writeFile(path, data, encoding),
        catch: (cause: unknown) => new FsWriteError({ path, cause }),
      }),
    );
    return Result.ok();
  });
}

/**
 * Appends data to a file, ensuring the directory exists.
 */
export async function appendFile(
  path: string,
  data: string | Buffer,
  encoding: BufferEncoding = "utf8",
): Promise<Result<void, FsAppendError | FsEnsureDirError>> {
  return Result.gen(async function* () {
    yield* Result.await(ensureDir(dirname(path)));
    yield* Result.await(
      Result.tryPromise({
        try: () => fs.appendFile(path, data, encoding),
        catch: (cause: unknown) => new FsAppendError({ path, cause }),
      }),
    );
    return Result.ok();
  });
}

/**
 * Ensures a file exists with optional default content.
 */
export async function ensureFile(
  path: string,
  defaultContent = "",
): Promise<
  Result<
    void,
    FsEnsureFileError | FsStatError | FsWriteError | FsEnsureDirError
  >
> {
  return Result.gen(async function* () {
    yield* Result.await(
      Result.tryPromise({
        try: () => fs.ensureFile(path),
        catch: (cause: unknown) => new FsEnsureFileError({ path, cause }),
      }),
    );

    if (defaultContent !== undefined) {
      const release = yield* Result.await(
        Result.tryPromise({
          try: () => lockfile.lock(path, { retries: 3, stale: 10000 }),
          catch: (cause: unknown) => new FsWriteError({ path, cause }),
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
          yield* Result.await(writeFile(path, defaultContent, "utf8"));
      } finally {
        if (typeof release === "function") {
          try {
            await release();
          } catch {}
        }
      }
    }
    return Result.ok();
  });
}

/**
 * Deletes a file if it exists.
 */
export async function deleteFile(
  path: string,
): Promise<Result<void, FsDeleteFileError>> {
  const result = await Result.tryPromise({
    try: () => fs.promises.unlink(path),
    catch: (cause: unknown) => cause,
  });
  return result.match({
    ok: () => Result.ok(),
    err: (cause) => {
      if (isEnoentError(cause)) return Result.ok();
      return Result.err(
        new FsDeleteFileError({
          path,
          cause,
        }),
      );
    },
  });
}
