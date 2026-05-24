import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_FAST_TRAVELS } from "../../../shared/fast-travels";
import { MainEnvironmentLive } from "../../app/MainEnvironment";
import {
  Observability,
  type ObservabilityShape,
} from "../../app/MainObservability";
import { PersistenceLive } from "../Persistence";
import {
  FAST_TRAVELS_STORAGE_FILE,
  FastTravelRepository,
  FastTravelRepositoryLive,
  type FastTravelRepositoryShape,
} from "./FastTravelRepository";

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
  FastTravelRepositoryLive.pipe(
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
  effect: (repository: FastTravelRepositoryShape) => Effect.Effect<A, unknown>,
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* FastTravelRepository;
      return yield* effect(repository);
    }).pipe(Effect.provide(makeLayer(dir))),
  );

describe("FastTravelRepository", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-fast-travels-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns defaults for missing storage without writing on read", async () => {
    const locations = await runWithRepository(
      testDir,
      (repository) => repository.get,
    );

    expect(locations).toEqual(DEFAULT_FAST_TRAVELS);
    expect(locations).not.toBe(DEFAULT_FAST_TRAVELS);

    await expect(
      readFile(join(testDir, FAST_TRAVELS_STORAGE_FILE), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("quarantines malformed storage and writes defaults", async () => {
    const path = join(testDir, FAST_TRAVELS_STORAGE_FILE);
    await writeFile(path, "{ nope", "utf8");

    await expect(
      runWithRepository(testDir, (repository) => repository.get),
    ).resolves.toEqual(DEFAULT_FAST_TRAVELS);

    await expect(readFile(path, "utf8")).resolves.toBe(
      `${JSON.stringify(DEFAULT_FAST_TRAVELS, null, 2)}\n`,
    );
    const files = await readdir(testDir);
    expect(
      files.some((file) =>
        file.startsWith(`${FAST_TRAVELS_STORAGE_FILE}.corrupt-`),
      ),
    ).toBe(true);
  });

  it("normalizes and persists updates", async () => {
    const path = join(testDir, FAST_TRAVELS_STORAGE_FILE);
    const locations = await runWithRepository(testDir, (repository) =>
      repository.update(() => [
        { name: " Home ", map: "Battleon" },
        { name: "home", map: "ignored" },
        { name: "Boss", map: "Escherion", cell: " Boss " },
      ]),
    );

    expect(locations).toEqual([
      { name: "Home", map: "battleon" },
      { name: "Boss", map: "escherion", cell: "Boss" },
    ]);
    await expect(readFile(path, "utf8")).resolves.toBe(
      `${JSON.stringify(locations, null, 2)}\n`,
    );
  });
});
