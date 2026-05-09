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
    const path = join(testDir, "missing", "settings.yaml");

    expect(normalize(Files.readYaml(path))).toEqual(defaults);
  });

  it("creates a missing file with defaults when ensured", async () => {
    const path = join(testDir, "missing", "settings.yaml");

    expect(Files.ensureYaml(path, defaults, normalize)).toEqual(defaults);
    expect(normalize(Files.readYaml(path))).toEqual(defaults);
  });

  it("preserves existing valid YAML when ensured", async () => {
    const path = join(testDir, "settings.yaml");
    const existing = { enabled: false, count: 7 };
    await writeFile(path, "enabled: false\ncount: 7\n", "utf8");

    expect(Files.ensureYaml(path, defaults, normalize)).toEqual(
      normalize(existing),
    );
    expect(normalize(Files.readYaml(path))).toEqual(normalize(existing));
    expect(await readFile(path, "utf8")).toBe("enabled: false\ncount: 7\n");
  });

  it("rewrites existing YAML after normalization", async () => {
    const path = join(testDir, "settings.yaml");
    await writeFile(path, "enabled: false\ncount: bad\nextra: true\n", "utf8");

    expect(Files.ensureYaml(path, defaults, normalize)).toEqual({
      enabled: false,
      count: 1,
    });
    expect(normalize(Files.readYaml(path))).toEqual({
      enabled: false,
      count: 1,
    });
  });

  it("reads and normalizes existing YAML", async () => {
    const path = join(testDir, "settings.yaml");
    await writeFile(path, "enabled: false\ncount: bad\nextra: true\n", "utf8");

    expect(normalize(Files.readYaml(path))).toEqual({
      enabled: false,
      count: 1,
    });
  });

  it("returns defaults for corrupt YAML", async () => {
    const path = join(testDir, "settings.yaml");
    await writeFile(path, "enabled: [nope\n", "utf8");

    expect(normalize(Files.readYaml(path))).toEqual(defaults);
  });

  it("replaces corrupt YAML with normalized defaults when ensured", async () => {
    const path = join(testDir, "settings.yaml");
    await writeFile(path, "enabled: [nope\n", "utf8");

    expect(Files.ensureYaml(path, defaults, normalize)).toEqual(defaults);
    expect(normalize(Files.readYaml(path))).toEqual(defaults);
  });

  it("rejects YAML aliases", async () => {
    const path = join(testDir, "settings.yaml");
    await writeFile(path, "enabled: &enabled false\ncount: *enabled\n", "utf8");

    expect(normalize(Files.readYaml(path))).toEqual(defaults);
  });

  it("rejects YAML tags", async () => {
    const path = join(testDir, "settings.yaml");
    await writeFile(path, "enabled: false\ncount: !custom 1\n", "utf8");

    expect(normalize(Files.readYaml(path))).toEqual(defaults);
  });

  it("writes pretty YAML with a trailing newline", async () => {
    const path = join(testDir, "nested", "settings.yaml");

    Files.writeYaml(path, { enabled: false, count: 3 });

    expect(await readFile(path, "utf8")).toBe("enabled: false\ncount: 3\n");
  });

  it("wraps write failures and cleans the current temp file when possible", async () => {
    const path = join(testDir, "settings.yaml");
    const circular: Record<string, unknown> = {};
    circular["self"] = circular;

    expect(() => Files.writeYaml(path, circular)).toThrow(Files.WriteError);

    expect(await readdir(testDir)).toEqual([]);
  });
});
