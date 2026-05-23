import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PersistenceError,
  makePersistence,
  parseYamlSource,
} from "./Persistence";

interface TestSettings {
  readonly enabled: boolean;
  readonly count: number;
}

const run = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect);

describe("persistence", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-persistence-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("distinguishes missing and malformed JSON", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "settings.json");

    await expect(run(persistence.readJson(path))).resolves.toEqual({
      status: "missing",
    });

    await writeFile(path, "{ nope", "utf8");

    await expect(run(persistence.readJson(path))).resolves.toMatchObject({
      status: "malformed",
      error: { path, format: "json" },
    });
  });

  it("does not write while reading existing JSON", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "settings.json");
    const source = '{"enabled":false,"extra":true}\n';
    await writeFile(path, source, "utf8");

    await expect(run(persistence.readJson(path))).resolves.toMatchObject({
      status: "ok",
      value: { enabled: false, extra: true },
    });
    await expect(readFile(path, "utf8")).resolves.toBe(source);
  });

  it("writes JSON atomically with parent directory creation", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "nested", "settings.json");

    await run(
      persistence.writeJson(path, {
        enabled: false,
        count: 3,
      } satisfies TestSettings),
    );

    await expect(readFile(path, "utf8")).resolves.toBe(
      `${JSON.stringify({ enabled: false, count: 3 }, null, 2)}\n`,
    );
    await expect(readdir(join(testDir, "nested"))).resolves.toEqual([
      "settings.json",
    ]);
  });

  it("rejects YAML aliases and explicit tags", () => {
    expect(() =>
      parseYamlSource("enabled: &enabled false\ncount: *enabled\n"),
    ).toThrow("YAML aliases are not supported");

    expect(() => parseYamlSource("enabled: false\ncount: !custom 1\n")).toThrow(
      "YAML tags are not supported",
    );
  });

  it("returns malformed for unsafe workspace YAML", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "army.yaml");
    await writeFile(path, "enabled: &enabled false\ncount: *enabled\n", "utf8");

    await expect(run(persistence.readYaml(path))).resolves.toMatchObject({
      status: "malformed",
      error: { path, format: "yaml" },
    });
  });

  it("writes YAML with a trailing newline", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "nested", "settings.yaml");

    await run(persistence.writeYaml(path, { enabled: false, count: 3 }));

    await expect(readFile(path, "utf8")).resolves.toBe(
      "enabled: false\ncount: 3\n",
    );
  });

  it("cleans temp files when serialization fails", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "settings.yaml");
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;

    await expect(
      run(persistence.writeYaml(path, circular)),
    ).rejects.toBeInstanceOf(PersistenceError);
    await expect(readdir(testDir)).resolves.toEqual([]);
  });

  it("keeps JSON serialization failures in the persistence error channel", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "settings.json");
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;

    await expect(
      run(persistence.writeJson(path, circular)),
    ).rejects.toBeInstanceOf(PersistenceError);
    await expect(readdir(testDir)).resolves.toEqual([]);
  });

  it("quarantines malformed files before defaults are written by repositories", async () => {
    const persistence = makePersistence();
    const path = join(testDir, "settings.json");
    await writeFile(path, "{ nope", "utf8");
    const result = await run(persistence.readJson(path));
    expect(result.status).toBe("malformed");

    const quarantinePath = await run(
      persistence.quarantineMalformed(path, "invalid json"),
    );

    expect(quarantinePath).not.toBeNull();
    await expect(readFile(quarantinePath!, "utf8")).resolves.toBe("{ nope");
    await expect(run(persistence.readJson(path))).resolves.toEqual({
      status: "missing",
    });
  });
});
