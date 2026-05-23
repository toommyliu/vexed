import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect, Layer } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COMBAT_PROFILE_LIBRARY } from "../../../shared/combat-profiles";
import { MainEnvironmentLive } from "../../app/MainEnvironment";
import {
  Observability,
  type ObservabilityShape,
} from "../../app/MainObservability";
import { PersistenceLive } from "../Persistence";
import {
  CombatProfileRepository,
  CombatProfileRepositoryLive,
  type CombatProfileRepositoryShape,
} from "./CombatProfileRepository";

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

const fileName = "combat-profiles.json";

const makeLayer = (dir: string) =>
  CombatProfileRepositoryLive.pipe(
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
    repository: CombatProfileRepositoryShape,
  ) => Effect.Effect<A, unknown>,
) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repository = yield* CombatProfileRepository;
      return yield* effect(repository);
    }).pipe(Effect.provide(makeLayer(dir))),
  );

describe("CombatProfileRepository", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-combat-profiles-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns defaults for missing storage without writing on read", async () => {
    const library = await runWithRepository(
      testDir,
      (repository) => repository.get,
    );

    expect(library).toEqual(DEFAULT_COMBAT_PROFILE_LIBRARY);
    expect(library).not.toBe(DEFAULT_COMBAT_PROFILE_LIBRARY);
    expect(library.profiles).not.toBe(DEFAULT_COMBAT_PROFILE_LIBRARY.profiles);

    await expect(
      readFile(join(testDir, fileName), "utf8"),
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("quarantines malformed app-data storage and writes defaults", async () => {
    const path = join(testDir, fileName);
    await writeFile(path, "{ nope", "utf8");

    await expect(
      runWithRepository(testDir, (repository) => repository.get),
    ).resolves.toEqual(DEFAULT_COMBAT_PROFILE_LIBRARY);

    await expect(readFile(path, "utf8")).resolves.toBe(
      `${JSON.stringify(DEFAULT_COMBAT_PROFILE_LIBRARY, null, 2)}\n`,
    );
    const files = await readdir(testDir);
    expect(files.some((file) => file.startsWith(`${fileName}.corrupt-`))).toBe(
      true,
    );
  });
});
