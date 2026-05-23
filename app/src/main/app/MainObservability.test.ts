import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
  BrowserWindow: {
    getAllWindows: () => [],
  },
  app: {
    on: vi.fn(),
  },
}));

import { makeObservability } from "./MainObservability";

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect);

describe("main observability", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-observability-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("writes sanitized NDJSON records and keeps an in-memory snapshot", async () => {
    const observability = makeObservability(testDir, {
      runId: "run-1",
      now: () => new Date("2026-05-22T12:00:00.000Z"),
    });

    const record = await run(
      observability.write({
        level: "info",
        source: "renderer",
        component: "settings",
        message: "Saved settings",
        data: {
          password: "secret",
          count: 1,
        },
      }),
    );

    expect(record).toMatchObject({
      id: 0,
      runId: "run-1",
      timestamp: "2026-05-22T12:00:00.000Z",
      level: "info",
      source: "renderer",
      component: "settings",
      message: "Saved settings",
      data: {
        password: "[REDACTED]",
        count: 1,
      },
    });

    await expect(readFile(observability.logPath, "utf8")).resolves.toBe(
      `${JSON.stringify(record)}\n`,
    );
    await expect(run(observability.snapshot)).resolves.toMatchObject({
      runId: "run-1",
      logPath: observability.logPath,
      records: [record],
    });
  });

  it("falls back to console output instead of failing caller writes", async () => {
    const filePath = join(testDir, "not-a-directory");
    await writeFile(filePath, "", "utf8");
    const observability = makeObservability(join(filePath, "child"), {
      runId: "run-1",
      now: () => new Date("2026-05-22T12:00:00.000Z"),
    });

    await expect(
      run(
        observability.error("startup", "Unable to write log", new Error("io")),
      ),
    ).resolves.toMatchObject({
      level: "error",
      message: "Unable to write log",
    });
  });
});
