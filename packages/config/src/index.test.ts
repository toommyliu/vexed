import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile, stat, utimes, writeFile } from "node:fs/promises";
import { writeJson } from "@vexed/fs";
import Config from "./index";

describe("Config", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), "config-test-"));
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("constructor", () => {
    it("should use default values when no options provided", () => {
      const config = new Config();
      expect((config as any).configName).toBe("config");
      expect((config as any).defaults).toEqual({});
    });

    it("should use provided options", () => {
      const config = new Config({
        configName: "test",
        cwd: testDir,
        defaults: { foo: "bar" },
      });
      expect((config as any).configName).toBe("test");
      expect((config as any).cwd).toBe(testDir);
      expect((config as any).defaults).toEqual({ foo: "bar" });
    });
  });

  describe("Config.create()", () => {
    it("should create and load a config in one call", async () => {
      const result = await Config.create({
        configName: "create-test",
        cwd: testDir,
        defaults: { key: "value" },
      });

      const config = result.unwrap();
      expect(config.get("key")).toBe("value");
    });

    it("should write defaults to disk when file doesn't exist", async () => {
      const result = await Config.create({
        configName: "create-new",
        cwd: testDir,
        defaults: { initial: true },
      });

      result.unwrap();

      const fileContent = await readFile(
        join(testDir, "create-new.json"),
        "utf8",
      );
      expect(JSON.parse(fileContent)).toEqual({ initial: true });
    });
  });

  describe("load()", () => {
    it("should create file with defaults if it doesn't exist", async () => {
      const config = new Config({
        configName: "new-config",
        cwd: testDir,
        defaults: { defaultKey: "defaultValue" },
      });

      const result = await config.load();
      result.unwrap();

      expect(config.get("defaultKey")).toBe("defaultValue");
    });

    it("should merge defaults with existing config", async () => {
      (
        await writeJson(join(testDir, "existing.json"), {
          existingKey: "existingValue",
        })
      ).unwrap();

      const config = new Config({
        configName: "existing",
        cwd: testDir,
        defaults: { existingKey: "shouldNotOverride", newKey: "newValue" },
      });
      const result = await config.load();
      result.unwrap();

      // Existing values should be preserved
      expect(config.get("existingKey")).toBe("existingValue");
      // New defaults should be added
      expect(config.get("newKey")).toBe("newValue");
    });

    it("should persist merged defaults to disk", async () => {
      (
        await writeJson(join(testDir, "merge-persist.json"), { old: true })
      ).unwrap();

      const result = await Config.create({
        configName: "merge-persist",
        cwd: testDir,
        defaults: { old: true, new: "default" },
      });

      result.unwrap();

      const fileContent = await readFile(
        join(testDir, "merge-persist.json"),
        "utf8",
      );
      const parsed = JSON.parse(fileContent);
      expect(parsed.old).toBe(true);
      expect(parsed.new).toBe("default");
    });

    it("should deep merge nested objects", async () => {
      (
        await writeJson(join(testDir, "nested.json"), {
          level1: { existingNested: "value" },
        })
      ).unwrap();

      const result = await Config.create({
        configName: "nested",
        cwd: testDir,
        defaults: {
          level1: { existingNested: "should-not-override", newNested: "added" },
          level2: { brand: "new" },
        },
      });

      const config = result.unwrap();

      expect(config.get("level1.existingNested")).toBe("value");
      expect(config.get("level1.newNested")).toBe("added");
      expect(config.get("level2.brand")).toBe("new");
    });
  });

  describe("save()", () => {
    it("should persist changes to disk", async () => {
      const result = await Config.create({
        configName: "save-test",
        cwd: testDir,
        defaults: { key: "initial" },
      });

      const config = result.unwrap();
      config.set("key", "value");
      const saveResult = await config.save();
      saveResult.unwrap();

      const fileContent = await readFile(
        join(testDir, "save-test.json"),
        "utf8",
      );
      expect(JSON.parse(fileContent)).toEqual({ key: "value" });
    });

    it("should remove stale atomic temp siblings while saving", async () => {
      const configName = "save-cleanup";
      const config = new Config({
        configName,
        cwd: testDir,
        defaults: { key: "initial" },
      });

      const configPath = join(testDir, `${configName}.json`);
      const staleTempPath = `${configPath}.tmp-1234567890abcdef`;
      await writeFile(staleTempPath, "stale", "utf8");
      const staleDate = new Date(Date.now() - 11 * 60 * 1000);
      await utimes(staleTempPath, staleDate, staleDate);

      config.set("key", "updated");
      const saveResult = await config.save();
      saveResult.unwrap();

      await expect(stat(staleTempPath)).rejects.toMatchObject({
        code: "ENOENT",
      });

      const fileContent = await readFile(configPath, "utf8");
      expect(JSON.parse(fileContent)).toEqual({ key: "updated" });
    });
  });

  describe("setAndSave()", () => {
    it("should set value and persist in one call", async () => {
      const result = await Config.create({
        configName: "set-and-save",
        cwd: testDir,
        defaults: { key: "initial" },
      });

      const config = result.unwrap();
      const setSaveResult = await config.setAndSave("key", "value");
      setSaveResult.unwrap();

      expect(config.get("key")).toBe("value");

      const fileContent = await readFile(
        join(testDir, "set-and-save.json"),
        "utf8",
      );
      expect(JSON.parse(fileContent)).toEqual({ key: "value" });
    });

    it("should work with object argument", async () => {
      const result = await Config.create({
        configName: "set-and-save-obj",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      const setSaveResult = await config.setAndSave({ a: 1, b: 2 } as any);
      setSaveResult.unwrap();

      expect(config.get("a")).toBe(1);
      expect(config.get("b")).toBe(2);
    });
  });

  describe("get()", () => {
    it("should return entire store when no key provided", async () => {
      const result = await Config.create({
        configName: "get-all",
        cwd: testDir,
        defaults: { a: 1, b: 2 },
      });

      const config = result.unwrap();
      expect(config.get()).toEqual({ a: 1, b: 2 });
    });

    it("should return value for simple key", async () => {
      const result = await Config.create({
        configName: "get-simple",
        cwd: testDir,
        defaults: { key: "value" },
      });

      const config = result.unwrap();
      expect(config.get("key")).toBe("value");
    });

    it("should return nested value with dot notation", async () => {
      const result = await Config.create({
        configName: "get-nested",
        cwd: testDir,
        defaults: { a: { b: { c: "deep" } } } as any,
      });

      const config = result.unwrap();
      expect(config.get("a.b.c")).toBe("deep");
    });

    it("should return defaultValue when key doesn't exist", async () => {
      const result = await Config.create({
        configName: "get-default",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      expect(config.get("missing", "fallback")).toBe("fallback");
    });
  });

  describe("getString()", () => {
    it("should return string value", async () => {
      const result = await Config.create({
        configName: "getstring",
        cwd: testDir,
        defaults: { name: "test" },
      });

      const config = result.unwrap();
      expect(config.getString("name")).toBe("test");
    });

    it("should return default when value is not a string", async () => {
      const result = await Config.create({
        configName: "getstring-type",
        cwd: testDir,
        defaults: { num: 42 } as any,
      });

      const config = result.unwrap();
      expect(config.getString("num", "fallback")).toBe("fallback");
    });

    it("should return empty string as default", async () => {
      const result = await Config.create({
        configName: "getstring-empty",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      expect(config.getString("missing")).toBe("");
    });
  });

  describe("getNumber()", () => {
    it("should return number value", async () => {
      const result = await Config.create({
        configName: "getnumber",
        cwd: testDir,
        defaults: { count: 42 },
      });

      const config = result.unwrap();
      expect(config.getNumber("count")).toBe(42);
    });

    it("should return default when value is not a number", async () => {
      const result = await Config.create({
        configName: "getnumber-type",
        cwd: testDir,
        defaults: { str: "hello" } as any,
      });

      const config = result.unwrap();
      expect(config.getNumber("str", 99)).toBe(99);
    });

    it("should return 0 as default", async () => {
      const result = await Config.create({
        configName: "getnumber-zero",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      expect(config.getNumber("missing")).toBe(0);
    });
  });

  describe("getBoolean()", () => {
    it("should return boolean value", async () => {
      const result = await Config.create({
        configName: "getbool",
        cwd: testDir,
        defaults: { enabled: true },
      });

      const config = result.unwrap();
      expect(config.getBoolean("enabled")).toBe(true);
    });

    it("should return default when value is not a boolean", async () => {
      const result = await Config.create({
        configName: "getbool-type",
        cwd: testDir,
        defaults: { str: "yes" } as any,
      });

      const config = result.unwrap();
      expect(config.getBoolean("str", true)).toBe(true);
    });

    it("should return false as default", async () => {
      const result = await Config.create({
        configName: "getbool-false",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      expect(config.getBoolean("missing")).toBe(false);
    });
  });

  describe("set()", () => {
    it("should set simple value", async () => {
      const result = await Config.create({
        configName: "set-simple",
        cwd: testDir,
        defaults: { key: "initial" },
      });

      const config = result.unwrap();
      config.set("key", "value");
      expect(config.get("key")).toBe("value");
    });

    it("should set nested value with dot notation", async () => {
      const result = await Config.create({
        configName: "set-nested",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      config.set("a.b.c", "deep");
      expect(config.get("a.b.c")).toBe("deep");
    });

    it("should merge object argument", async () => {
      const result = await Config.create({
        configName: "set-object",
        cwd: testDir,
        defaults: { existing: true } as any,
      });

      const config = result.unwrap();
      config.set({ new: "value" } as any);
      expect(config.get("existing")).toBe(true);
      expect(config.get("new")).toBe("value");
    });

    it("should throw for non-string keys", async () => {
      const result = await Config.create({
        configName: "set-throw",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      // @ts-ignore
      expect(() => config.set(123 as any, "value")).toThrow(TypeError);
    });
  });

  describe("has()", () => {
    it("should return true for existing key", async () => {
      const result = await Config.create({
        configName: "has-exists",
        cwd: testDir,
        defaults: { key: "value" },
      });

      const config = result.unwrap();
      expect(config.has("key")).toBe(true);
    });

    it("should return false for non-existing key", async () => {
      const result = await Config.create({
        configName: "has-missing",
        cwd: testDir,
        defaults: {},
      });

      const config = result.unwrap();
      expect(config.has("missing")).toBe(false);
    });

    it("should check nested keys with dot notation", async () => {
      const result = await Config.create({
        configName: "has-nested",
        cwd: testDir,
        defaults: { a: { b: true } } as any,
      });

      const config = result.unwrap();
      expect(config.has("a.b")).toBe(true);
      expect(config.has("a.c")).toBe(false);
    });
  });

  describe("delete()", () => {
    it("should delete simple key", async () => {
      const result = await Config.create({
        configName: "delete-simple",
        cwd: testDir,
        defaults: { key: "value" },
      });

      const config = result.unwrap();
      config.delete("key");
      expect(config.has("key")).toBe(false);
    });

    it("should delete nested key with dot notation", async () => {
      const result = await Config.create({
        configName: "delete-nested",
        cwd: testDir,
        defaults: { a: { b: "value", c: "keep" } } as any,
      });

      const config = result.unwrap();
      config.delete("a.b");
      expect(config.has("a.b")).toBe(false);
      expect(config.get("a.c")).toBe("keep");
    });
  });

  describe("clear()", () => {
    it("should reset to defaults", async () => {
      const result = await Config.create({
        configName: "clear-test",
        cwd: testDir,
        defaults: { default: true },
      });

      const config = result.unwrap();
      config.set("extra" as any, "value");
      config.clear();

      expect(config.get()).toEqual({ default: true });
    });
  });

  describe("reset()", () => {
    it("should clear the cache", async () => {
      const result = await Config.create({
        configName: "reset-test",
        cwd: testDir,
        defaults: { key: "value" },
      });

      const config = result.unwrap();
      const resetResult = config.reset();
      expect(resetResult).toBe(null);
    });
  });

  describe("reload()", () => {
    it("should reload from disk", async () => {
      const result = await Config.create({
        configName: "reload-test",
        cwd: testDir,
        defaults: { key: "initial" },
      });

      const config = result.unwrap();

      (
        await writeJson(join(testDir, "reload-test.json"), { key: "modified" })
      ).unwrap();

      const reloadResult = await config.reload();
      reloadResult.unwrap();
      expect(config.get("key")).toBe("modified");
    });
  });
});
