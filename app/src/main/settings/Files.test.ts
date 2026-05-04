import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as Files from "./Files";

interface TestSettings {
  readonly enabled: boolean;
  readonly count: number;
}

const defaults: TestSettings = {
  enabled: true,
  count: 1,
};

const normalize = (value: unknown): TestSettings => {
  if (typeof value !== "object" || value === null) {
    return defaults;
  }

  const record = value as Record<string, unknown>;
  return {
    enabled:
      typeof record["enabled"] === "boolean"
        ? record["enabled"]
        : defaults.enabled,
    count:
      typeof record["count"] === "number" ? record["count"] : defaults.count,
  };
};

describe("Files", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "vexed-files-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("returns defaults when the file is missing", () => {
    const path = join(testDir, "missing", "settings.json");

    expect(normalize(Files.readJson(path))).toEqual(defaults);
  });

  it("creates a missing file with defaults when ensured", async () => {
    const path = join(testDir, "missing", "settings.json");

    expect(Files.ensureJson(path, defaults, normalize)).toEqual(defaults);
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(defaults);
  });

  it("reads and normalizes existing JSON", async () => {
    const path = join(testDir, "settings.json");
    await writeFile(
      path,
      JSON.stringify({ enabled: false, count: "bad", extra: true }),
      "utf8",
    );

    expect(normalize(Files.readJson(path))).toEqual({
      enabled: false,
      count: 1,
    });
  });

  it("returns defaults for corrupt JSON", async () => {
    const path = join(testDir, "settings.json");
    await writeFile(path, "{ nope", "utf8");

    expect(normalize(Files.readJson(path))).toEqual(defaults);
  });

  it("replaces corrupt JSON with normalized defaults when ensured", async () => {
    const path = join(testDir, "settings.json");
    await writeFile(path, "{ nope", "utf8");

    expect(Files.ensureJson(path, defaults, normalize)).toEqual(defaults);
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual(defaults);
  });

  it("writes pretty JSON with a trailing newline", async () => {
    const path = join(testDir, "nested", "settings.json");

    Files.writeJson(path, { enabled: false, count: 3 });

    expect(await readFile(path, "utf8")).toBe(
      `{
  "enabled": false,
  "count": 3
}
`,
    );
  });

  it("wraps write failures and cleans the current temp file when possible", async () => {
    const path = join(testDir, "settings.json");
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;

    expect(() => Files.writeJson(path, circular)).toThrow(Files.WriteError);

    expect(await readdir(testDir)).toEqual([]);
  });
});
