import { BrowserWindow } from "electron";
import type { IncomingHttpHeaders } from "http";
import { get } from "https";
import { Data, Effect, Layer, ServiceMap } from "effect";
import {
  UpdatesIpcChannels,
  type UpdateCheckState,
  type UpdateReleaseInfo,
} from "../../shared/ipc";

const RELEASE_URL =
  "https://api.github.com/repos/toommyliu/vexed/releases/latest";
const CHECK_TIMEOUT_MS = 10_000;

export class UpdateCheckError extends Data.TaggedError("UpdateCheckError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface UpdateCheckerShape {
  readonly getState: Effect.Effect<UpdateCheckState>;
  readonly checkNow: (options?: {
    readonly force?: boolean;
  }) => Effect.Effect<UpdateCheckState>;
}

export class UpdateChecker extends ServiceMap.Service<
  UpdateChecker,
  UpdateCheckerShape
>()("main/UpdateChecker") {}

interface GitHubReleasePayload {
  readonly tag_name?: unknown;
  readonly name?: unknown;
  readonly html_url?: unknown;
  readonly published_at?: unknown;
  readonly body?: unknown;
  readonly draft?: unknown;
  readonly prerelease?: unknown;
}

export type UpdateReleaseFetchResult =
  | {
      readonly status: "modified";
      readonly release: UpdateReleaseInfo;
      readonly etag?: string;
    }
  | {
      readonly status: "not-modified";
      readonly etag?: string;
    };

export interface UpdateReleaseFetchOptions {
  readonly etag?: string;
}

export interface UpdateReleaseCache {
  readonly release: UpdateReleaseInfo;
  readonly etag?: string;
}

export interface UpdateCheckerOptions {
  readonly currentVersion: string;
  readonly isEnabled: () => Effect.Effect<boolean>;
  readonly loadCache?: Effect.Effect<UpdateReleaseCache | null>;
  readonly saveCache?: (cache: UpdateReleaseCache) => Effect.Effect<void>;
  readonly now?: () => Date;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const optionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

const normalizeCachedRelease = (value: unknown): UpdateReleaseInfo | null => {
  if (!isRecord(value)) {
    return null;
  }

  const version = optionalString(value["version"]);
  const tagName = optionalString(value["tagName"]);
  const htmlUrl = optionalString(value["htmlUrl"]);
  const name = optionalString(value["name"]);
  const publishedAt = optionalString(value["publishedAt"]);
  const body = optionalString(value["body"]);
  if (version === undefined || tagName === undefined || htmlUrl === undefined) {
    return null;
  }

  return {
    version,
    tagName,
    htmlUrl,
    ...(name === undefined ? {} : { name }),
    ...(publishedAt === undefined ? {} : { publishedAt }),
    ...(body === undefined ? {} : { body }),
  };
};

export const normalizeUpdateReleaseCache = (
  value: unknown,
): UpdateReleaseCache | null => {
  if (!isRecord(value)) {
    return null;
  }

  const release = normalizeCachedRelease(value["release"]);
  if (release === null) {
    return null;
  }

  const etag = optionalString(value["etag"]);
  return {
    release,
    ...(etag === undefined ? {} : { etag }),
  };
};

export const serializeUpdateReleaseCache = (
  cache: UpdateReleaseCache,
): UpdateReleaseCache => ({
  release: cache.release,
  ...(cache.etag === undefined ? {} : { etag: cache.etag }),
});

export const updateCacheFileName = "updates.json";

export class UpdateCacheError extends Data.TaggedError("UpdateCacheError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface UpdateCacheStore {
  readonly load: Effect.Effect<UpdateReleaseCache | null, UpdateCacheError>;
  readonly save: (
    cache: UpdateReleaseCache,
  ) => Effect.Effect<void, UpdateCacheError>;
}

export const makeUpdateCacheStore = (options: {
  readonly readJson: (
    path: string,
  ) => Effect.Effect<
    | { readonly status: "missing" }
    | { readonly status: "malformed"; readonly error: unknown }
    | { readonly status: "ok"; readonly value: unknown },
    unknown
  >;
  readonly writeJson: (
    path: string,
    value: unknown,
  ) => Effect.Effect<void, unknown>;
  readonly path: string;
}): UpdateCacheStore => ({
  load: options.readJson(options.path).pipe(
    Effect.map((result) => {
      if (result.status !== "ok") {
        return null;
      }

      return normalizeUpdateReleaseCache(result.value);
    }),
    Effect.mapError(
      (cause) =>
        new UpdateCacheError({
          message: "Failed to load update cache",
          cause,
        }),
    ),
  ),
  save: (cache) =>
    options.writeJson(options.path, serializeUpdateReleaseCache(cache)).pipe(
      Effect.mapError(
        (cause) =>
          new UpdateCacheError({
            message: "Failed to save update cache",
            cause,
          }),
      ),
    ),
});

const makeModifiedRelease = (
  release: UpdateReleaseInfo,
  etag?: string,
): UpdateReleaseFetchResult => ({
  status: "modified",
  release,
  ...(etag === undefined ? {} : { etag }),
});

const makeNotModifiedRelease = (etag?: string): UpdateReleaseFetchResult => ({
  status: "not-modified",
  ...(etag === undefined ? {} : { etag }),
});

const firstHeader = (
  headers: IncomingHttpHeaders,
  name: string,
): string | undefined => {
  const value = headers[name];
  if (Array.isArray(value)) {
    return value.find((entry) => entry.trim() !== "");
  }

  return typeof value === "string" && value.trim() !== "" ? value : undefined;
};

const requestHeaders = (
  options?: UpdateReleaseFetchOptions,
): Record<string, string> => ({
  Accept: "application/vnd.github+json",
  "User-Agent": "vexed-update-checker",
  ...(options?.etag === undefined ? {} : { "If-None-Match": options.etag }),
});

export const fetchLatestGitHubRelease = (
  options?: UpdateReleaseFetchOptions,
): Effect.Effect<UpdateReleaseFetchResult, UpdateCheckError> =>
  Effect.tryPromise({
    try: () =>
      new Promise<UpdateReleaseFetchResult>((resolve, reject) => {
        const request = get(
          RELEASE_URL,
          { headers: requestHeaders(options) },
          (response) => {
            const statusCode = response.statusCode ?? 0;
            const etag = firstHeader(response.headers, "etag");
            const chunks: Buffer[] = [];

            response.on("error", reject);
            response.on("data", (chunk: Buffer | string) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            response.on("end", () => {
              if (statusCode === 304) {
                resolve(makeNotModifiedRelease(etag));
                return;
              }

              const source = Buffer.concat(chunks).toString("utf8");
              if (statusCode < 200 || statusCode >= 300) {
                reject(
                  new Error(
                    `GitHub Releases returned HTTP ${statusCode} ${
                      response.statusMessage ?? ""
                    }`.trim(),
                  ),
                );
                return;
              }

              try {
                resolve(
                  makeModifiedRelease(
                    parseRelease(JSON.parse(source) as GitHubReleasePayload),
                    etag,
                  ),
                );
              } catch (error) {
                reject(error);
              }
            });
          },
        );

        request.setTimeout(CHECK_TIMEOUT_MS, () => {
          request.destroy(new Error("Timed out while checking for updates"));
        });
        request.on("error", reject);
      }),
    catch: (cause) =>
      new UpdateCheckError({ message: errorMessage(cause), cause }),
  });

const normalizeVersion = (version: string): string =>
  version.trim().replace(/^v/i, "");

const parseVersionParts = (version: string): readonly number[] | null => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(
    normalizeVersion(version),
  );
  if (!match) {
    return null;
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

export const compareSemver = (left: string, right: string): number => {
  const leftParts = parseVersionParts(left);
  const rightParts = parseVersionParts(right);
  if (!leftParts || !rightParts) {
    return normalizeVersion(left).localeCompare(normalizeVersion(right));
  }

  for (let index = 0; index < 3; index++) {
    const diff = leftParts[index]! - rightParts[index]!;
    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
};

const errorMessage = (cause: unknown): string =>
  cause instanceof Error && cause.message !== ""
    ? cause.message
    : "Failed to check for updates";

const parseRelease = (payload: GitHubReleasePayload): UpdateReleaseInfo => {
  if (payload.draft === true || payload.prerelease === true) {
    throw new Error("Latest release is not a stable release");
  }

  const tagName = payload.tag_name;
  const htmlUrl = payload.html_url;
  if (typeof tagName !== "string" || tagName.trim() === "") {
    throw new Error("Release payload is missing tag_name");
  }
  if (typeof htmlUrl !== "string" || htmlUrl.trim() === "") {
    throw new Error("Release payload is missing html_url");
  }

  return {
    version: normalizeVersion(tagName),
    tagName,
    htmlUrl,
    ...(typeof payload.name === "string" && payload.name.trim() !== ""
      ? { name: payload.name }
      : {}),
    ...(typeof payload.published_at === "string"
      ? { publishedAt: payload.published_at }
      : {}),
    ...(typeof payload.body === "string" ? { body: payload.body } : {}),
  };
};

const broadcastUpdateState = (state: UpdateCheckState): void => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed() || win.webContents.isDestroyed()) {
      continue;
    }

    win.webContents.send(UpdatesIpcChannels.changed, state);
  }
};

export const makeUpdateChecker = (
  options: UpdateCheckerOptions,
): UpdateCheckerShape => {
  const currentVersion = normalizeVersion(options.currentVersion);
  const now = options.now ?? (() => new Date());
  let state: UpdateCheckState = {
    status: "idle",
    currentVersion,
  };
  let cachedRelease: UpdateReleaseCache | null = null;
  let cacheLoaded = false;
  let inFlight: Promise<UpdateCheckState> | null = null;

  const setState = (next: UpdateCheckState): UpdateCheckState => {
    state = next;
    broadcastUpdateState(next);
    return next;
  };

  const loadCachedRelease = Effect.gen(function* () {
    if (!cacheLoaded) {
      cachedRelease =
        options.loadCache === undefined ? null : yield* options.loadCache;
      cacheLoaded = true;
    }

    return cachedRelease;
  });

  const saveCachedRelease = (cache: UpdateReleaseCache) =>
    Effect.gen(function* () {
      const serialized = serializeUpdateReleaseCache(cache);
      cachedRelease = serialized;
      cacheLoaded = true;
      if (options.saveCache !== undefined) {
        yield* options.saveCache(serialized);
      }
    });

  const stateFromRelease = (
    release: UpdateReleaseInfo,
    checkedAt: string,
  ): UpdateCheckState => {
    if (compareSemver(release.version, currentVersion) > 0) {
      return {
        status: "available",
        currentVersion,
        latestVersion: release.version,
        checkedAt,
        release,
      };
    }

    return {
      status: "current",
      currentVersion,
      latestVersion: release.version,
      checkedAt,
    };
  };

  const runCheckProgram = (): Promise<UpdateCheckState> =>
    Effect.runPromise(
      Effect.gen(function* () {
        const cache = yield* loadCachedRelease;
        const fetchOptions =
          cache?.etag === undefined ? undefined : { etag: cache.etag };
        const result = yield* fetchLatestGitHubRelease(fetchOptions);

        if (result.status === "modified") {
          const checkedAt = now().toISOString();
          yield* saveCachedRelease({
            release: result.release,
            ...(result.etag === undefined ? {} : { etag: result.etag }),
          });
          return setState(stateFromRelease(result.release, checkedAt));
        }

        if (cache === null) {
          return yield* new UpdateCheckError({
            message: "Release was not modified but no cached release exists",
          });
        }

        const checkedAt = now().toISOString();
        const etag = result.etag ?? cache.etag;
        yield* saveCachedRelease({
          release: cache.release,
          ...(etag === undefined ? {} : { etag }),
        });
        return setState(stateFromRelease(cache.release, checkedAt));
      }).pipe(
        Effect.catch((error: UpdateCheckError) =>
          Effect.succeed(
            setState({
              status: "failed",
              currentVersion,
              checkedAt: now().toISOString(),
              error: error.message,
            }),
          ),
        ),
      ),
    );

  const checkNow: UpdateCheckerShape["checkNow"] = (checkOptions) =>
    Effect.gen(function* () {
      const enabled = yield* options.isEnabled();
      if (!enabled && checkOptions?.force !== true) {
        return state;
      }

      if (inFlight) {
        return yield* Effect.promise(() => inFlight!);
      }

      const previousLastChecked =
        state.status === "idle" || state.status === "checking"
          ? state.lastCheckedAt
          : "checkedAt" in state
            ? state.checkedAt
            : undefined;
      setState({
        status: "checking",
        currentVersion,
        ...(previousLastChecked === undefined
          ? {}
          : { lastCheckedAt: previousLastChecked }),
      });

      const program = runCheckProgram().finally(() => {
        inFlight = null;
      });

      inFlight = program;
      return yield* Effect.promise(() => program);
    });

  return {
    getState: Effect.sync(() => state),
    checkNow,
  };
};

export const UpdateCheckerLive = (options: UpdateCheckerOptions) =>
  Layer.succeed(UpdateChecker, makeUpdateChecker(options));
