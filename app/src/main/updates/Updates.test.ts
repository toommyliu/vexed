import { EventEmitter } from "events";
import type { ClientRequest, IncomingMessage } from "http";
import { get as httpsGet } from "https";
import { Effect } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: () => [],
  },
}));

vi.mock("https", () => ({
  get: vi.fn(),
}));

import {
  compareSemver,
  makeUpdateChecker,
  type UpdateReleaseCache,
} from "./Updates";

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect);

const httpsGetMock = vi.mocked(httpsGet);

const releasePayload = (version: string) => ({
  tag_name: `v${version}`,
  html_url: `https://github.com/toommyliu/vexed/releases/tag/v${version}`,
});

const mockGitHubResponse = (options: {
  readonly statusCode: number;
  readonly statusMessage?: string;
  readonly headers?: Record<string, string>;
  readonly body?: unknown;
}): void => {
  httpsGetMock.mockImplementationOnce(((
    _url: string,
    _requestOptions: unknown,
    callback: unknown,
  ) => {
    const response = new EventEmitter() as IncomingMessage;
    response.statusCode = options.statusCode;
    response.statusMessage = options.statusMessage ?? "";
    response.headers = options.headers ?? {};

    queueMicrotask(() => {
      (callback as (response: IncomingMessage) => void)(response);
      if (options.body !== undefined) {
        response.emit(
          "data",
          typeof options.body === "string"
            ? options.body
            : JSON.stringify(options.body),
        );
      }
      response.emit("end");
    });

    const requestEmitter = new EventEmitter();
    const request = requestEmitter as ClientRequest;
    request.setTimeout = vi.fn(() => request) as ClientRequest["setTimeout"];
    request.destroy = vi.fn((error?: Error) => {
      if (error !== undefined) {
        queueMicrotask(() => request.emit("error", error));
      }
      return request;
    }) as ClientRequest["destroy"];
    return request;
  }) as never);
};

describe("update checker", () => {
  beforeEach(() => {
    vi.useRealTimers();
    httpsGetMock.mockReset();
  });

  it("compares v-prefixed semver tags", () => {
    expect(compareSemver("v1.2.4", "1.2.3")).toBeGreaterThan(0);
    expect(compareSemver("1.2.3", "v1.2.3")).toBe(0);
    expect(compareSemver("1.2.2", "v1.2.3")).toBeLessThan(0);
  });

  it("reports an available release", async () => {
    mockGitHubResponse({
      statusCode: 200,
      headers: { etag: '"release-1.2.4"' },
      body: releasePayload("1.2.4"),
    });
    const checker = makeUpdateChecker({
      currentVersion: "1.2.3",
      isEnabled: () => Effect.succeed(true),
      now: () => new Date("2026-05-22T12:00:00.000Z"),
    });

    await expect(run(checker.checkNow())).resolves.toMatchObject({
      status: "available",
      currentVersion: "1.2.3",
      latestVersion: "1.2.4",
      checkedAt: "2026-05-22T12:00:00.000Z",
      release: {
        tagName: "v1.2.4",
      },
    });
  });

  it("reports current when latest stable is not newer", async () => {
    mockGitHubResponse({
      statusCode: 200,
      body: releasePayload("1.2.3"),
    });
    const checker = makeUpdateChecker({
      currentVersion: "1.2.3",
      isEnabled: () => Effect.succeed(true),
    });

    await expect(run(checker.checkNow())).resolves.toMatchObject({
      status: "current",
      currentVersion: "1.2.3",
      latestVersion: "1.2.3",
    });
  });

  it("does not check when preferences disable update checks", async () => {
    const checker = makeUpdateChecker({
      currentVersion: "1.2.3",
      isEnabled: () => Effect.succeed(false),
    });

    await expect(run(checker.checkNow())).resolves.toEqual({
      status: "idle",
      currentVersion: "1.2.3",
    });
    expect(httpsGetMock).not.toHaveBeenCalled();
  });

  it("allows forced checks even when preferences disable automatic checks", async () => {
    mockGitHubResponse({
      statusCode: 200,
      body: releasePayload("1.2.4"),
    });
    const checker = makeUpdateChecker({
      currentVersion: "1.2.3",
      isEnabled: () => Effect.succeed(false),
    });

    await expect(run(checker.checkNow({ force: true }))).resolves.toMatchObject(
      {
        status: "available",
        latestVersion: "1.2.4",
      },
    );
  });

  it("records failed checks without throwing to menu or renderer callers", async () => {
    mockGitHubResponse({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
    const checker = makeUpdateChecker({
      currentVersion: "1.2.3",
      isEnabled: () => Effect.succeed(true),
    });

    await expect(run(checker.checkNow())).resolves.toMatchObject({
      status: "failed",
      currentVersion: "1.2.3",
      error: "GitHub Releases returned HTTP 500 Internal Server Error",
    });
  });

  it("sends cached etags and reuses the cached release on 304 responses", async () => {
    let cache: UpdateReleaseCache | null = {
      release: {
        version: "1.2.4",
        tagName: "v1.2.4",
        htmlUrl: "https://github.com/toommyliu/vexed/releases/tag/v1.2.4",
      },
      etag: '"release-1.2.4"',
    };
    mockGitHubResponse({
      statusCode: 304,
      headers: { etag: '"release-1.2.4b"' },
    });
    const saveCache = vi.fn((next: UpdateReleaseCache) => {
      cache = next;
      return Effect.void;
    });
    const checker = makeUpdateChecker({
      currentVersion: "1.2.3",
      isEnabled: () => Effect.succeed(true),
      now: () => new Date("2026-05-22T12:00:00.000Z"),
      loadCache: Effect.sync(() => cache),
      saveCache,
    });

    await expect(run(checker.checkNow())).resolves.toMatchObject({
      status: "available",
      latestVersion: "1.2.4",
      checkedAt: "2026-05-22T12:00:00.000Z",
    });
    expect(httpsGetMock).toHaveBeenCalledTimes(1);
    expect(httpsGetMock.mock.calls[0]?.[1]).toMatchObject({
      headers: {
        "If-None-Match": '"release-1.2.4"',
      },
    });
    expect(saveCache).toHaveBeenCalledWith({
      release: {
        version: "1.2.4",
        tagName: "v1.2.4",
        htmlUrl: "https://github.com/toommyliu/vexed/releases/tag/v1.2.4",
      },
      etag: '"release-1.2.4b"',
    });
    expect(cache?.etag).toBe('"release-1.2.4b"');
  });
});
