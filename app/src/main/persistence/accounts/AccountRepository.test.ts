import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MainEnvironmentLive } from "../../app/MainEnvironment";
import {
  Observability,
  type ObservabilityShape,
} from "../../app/MainObservability";
import { PersistenceLive } from "../Persistence";
import {
  AccountManagerRepository,
  AccountManagerRepositoryLive,
  type AccountManagerRepositoryShape,
} from "./AccountRepository";
import {
  ACCOUNT_MANAGER_STORAGE_FILE,
  emptyAccountManagerStorage,
} from "./AccountStore";

const observability: ObservabilityShape = {
  runId: "test",
  logPath: "/tmp/vexed-test.ndjson",
  write: () =>
    Effect.succeed({
      id: 0,
      runId: "test",
      timestamp: "2026-05-22T00:00:00.000Z",
      level: "info",
      source: "main",
      component: "test",
      message: "test",
    }),
  debug: () =>
    Effect.succeed({
      id: 0,
      runId: "test",
      timestamp: "2026-05-22T00:00:00.000Z",
      level: "debug",
      source: "main",
      component: "test",
      message: "test",
    }),
  info: () =>
    Effect.succeed({
      id: 0,
      runId: "test",
      timestamp: "2026-05-22T00:00:00.000Z",
      level: "info",
      source: "main",
      component: "test",
      message: "test",
    }),
  warn: () =>
    Effect.succeed({
      id: 0,
      runId: "test",
      timestamp: "2026-05-22T00:00:00.000Z",
      level: "warn",
      source: "main",
      component: "test",
      message: "test",
    }),
  error: () =>
    Effect.succeed({
      id: 0,
      runId: "test",
      timestamp: "2026-05-22T00:00:00.000Z",
      level: "error",
      source: "main",
      component: "test",
      message: "test",
    }),
  snapshot: Effect.succeed({
    runId: "test",
    logPath: "/tmp/vexed-test.ndjson",
    records: [],
  }),
  installProcessHooks: Effect.void,
  observeWindow: () => Effect.void,
};

const makeLayer = (dir: string) =>
  AccountManagerRepositoryLive.pipe(
    Layer.provide(
      Layer.mergeAll(
        MainEnvironmentLive({
          appDataDir: dir,
          workspaceDir: join(dir, "workspace"),
          assetsDir: join(dir, "assets"),
          rendererDir: join(dir, "renderer"),
          preloadPath: join(dir, "preload.js"),
          isDev: false,
          isDarwin: true,
          isWin: false,
          isLinux: false,
        }),
        PersistenceLive,
        Layer.succeed(Observability)(observability),
      ),
    ),
  );

const runWithRepository = <A>(
  dir: string,
  effect: (
    repository: AccountManagerRepositoryShape,
  ) => Effect.Effect<A, unknown>,
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* AccountManagerRepository;
      return yield* effect(repository);
    }).pipe(Effect.provide(makeLayer(dir))),
  );

describe("AccountManagerRepository", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-accounts-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns defaults for missing storage without writing on read", async () => {
    await expect(
      runWithRepository(testDir, (repository) => repository.get),
    ).resolves.toEqual(emptyAccountManagerStorage());

    await expect(
      readFile(join(testDir, ACCOUNT_MANAGER_STORAGE_FILE), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("returns a fresh default storage object for each empty store", () => {
    const first = emptyAccountManagerStorage();
    const second = emptyAccountManagerStorage();

    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.accounts).not.toBe(second.accounts);
  });

  it("quarantines malformed app-data storage and writes defaults", async () => {
    const path = join(testDir, ACCOUNT_MANAGER_STORAGE_FILE);
    await writeFile(path, "{ nope", "utf8");

    await expect(
      runWithRepository(testDir, (repository) => repository.get),
    ).resolves.toEqual(emptyAccountManagerStorage());

    await expect(readFile(path, "utf8")).resolves.toBe(
      `${JSON.stringify(emptyAccountManagerStorage(), null, 2)}\n`,
    );
    const files = await readdir(testDir);
    expect(
      files.some((file) =>
        file.startsWith(`${ACCOUNT_MANAGER_STORAGE_FILE}.corrupt-`),
      ),
    ).toBe(true);
  });
});
