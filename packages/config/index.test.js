import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "path";
import { tmpdir } from "os";
import { mkdtemp, rm, readFile } from "fs/promises";
import { writeJson } from "@vexed/fs-utils";
import Config from "./index.js";

describe("Config", () => {
    let testDir;

    beforeEach(async () => {
        testDir = await mkdtemp(join(tmpdir(), "config-test-"));
    });

    afterEach(async () => {
        await rm(testDir, { recursive: true, force: true });
    });

    describe("constructor", () => {
        it("should use default values when no options provided", () => {
            const config = new Config();
            expect(config.configName).toBe("config");
            expect(config.defaults).toEqual({});
        });

        it("should use provided options", () => {
            const config = new Config({
                configName: "test",
                cwd: testDir,
                defaults: { foo: "bar" },
            });
            expect(config.configName).toBe("test");
            expect(config.cwd).toBe(testDir);
            expect(config.defaults).toEqual({ foo: "bar" });
        });
    });

    describe("Config.create()", () => {
        it("should create and load a config in one call", async () => {
            const config = await Config.create({
                configName: "create-test",
                cwd: testDir,
                defaults: { key: "value" },
            });

            expect(config.get("key")).toBe("value");
        });

        it("should write defaults to disk when file doesn't exist", async () => {
            await Config.create({
                configName: "create-new",
                cwd: testDir,
                defaults: { initial: true },
            });

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

            await config.load();

            expect(config.get("defaultKey")).toBe("defaultValue");
        });

        it("should merge defaults with existing config", async () => {
            // Create initial config file
            await writeJson(join(testDir, "existing.json"), { existingKey: "existingValue" });

            // Load with new defaults
            const config = new Config({
                configName: "existing",
                cwd: testDir,
                defaults: { existingKey: "shouldNotOverride", newKey: "newValue" },
            });
            await config.load();

            // Existing values should be preserved
            expect(config.get("existingKey")).toBe("existingValue");
            // New defaults should be added
            expect(config.get("newKey")).toBe("newValue");
        });

        it("should persist merged defaults to disk", async () => {
            await writeJson(join(testDir, "merge-persist.json"), { old: true });

            await Config.create({
                configName: "merge-persist",
                cwd: testDir,
                defaults: { old: true, new: "default" },
            });

            // Read file directly
            const fileContent = await readFile(
                join(testDir, "merge-persist.json"),
                "utf8",
            );
            const parsed = JSON.parse(fileContent);
            expect(parsed.old).toBe(true);
            expect(parsed.new).toBe("default");
        });

        it("should deep merge nested objects", async () => {
            await writeJson(join(testDir, "nested.json"), {
                level1: { existingNested: "value" },
            });

            const config = await Config.create({
                configName: "nested",
                cwd: testDir,
                defaults: {
                    level1: { existingNested: "should-not-override", newNested: "added" },
                    level2: { brand: "new" },
                },
            });

            expect(config.get("level1.existingNested")).toBe("value");
            expect(config.get("level1.newNested")).toBe("added");
            expect(config.get("level2.brand")).toBe("new");
        });
    });

    describe("save()", () => {
        it("should persist changes to disk", async () => {
            const config = await Config.create({
                configName: "save-test",
                cwd: testDir,
                defaults: {},
            });

            config.set("key", "value");
            await config.save();

            const fileContent = await readFile(
                join(testDir, "save-test.json"),
                "utf8",
            );
            expect(JSON.parse(fileContent)).toEqual({ key: "value" });
        });
    });

    describe("setAndSave()", () => {
        it("should set value and persist in one call", async () => {
            const config = await Config.create({
                configName: "set-and-save",
                cwd: testDir,
                defaults: {},
            });

            await config.setAndSave("key", "value");

            // Verify in memory
            expect(config.get("key")).toBe("value");

            // Verify on disk
            const fileContent = await readFile(
                join(testDir, "set-and-save.json"),
                "utf8",
            );
            expect(JSON.parse(fileContent)).toEqual({ key: "value" });
        });

        it("should work with object argument", async () => {
            const config = await Config.create({
                configName: "set-and-save-obj",
                cwd: testDir,
                defaults: {},
            });

            await config.setAndSave({ a: 1, b: 2 });

            expect(config.get("a")).toBe(1);
            expect(config.get("b")).toBe(2);
        });
    });

    describe("get()", () => {
        it("should return entire store when no key provided", async () => {
            const config = await Config.create({
                configName: "get-all",
                cwd: testDir,
                defaults: { a: 1, b: 2 },
            });

            expect(config.get()).toEqual({ a: 1, b: 2 });
        });

        it("should return value for simple key", async () => {
            const config = await Config.create({
                configName: "get-simple",
                cwd: testDir,
                defaults: { key: "value" },
            });

            expect(config.get("key")).toBe("value");
        });

        it("should return nested value with dot notation", async () => {
            const config = await Config.create({
                configName: "get-nested",
                cwd: testDir,
                defaults: { a: { b: { c: "deep" } } },
            });

            expect(config.get("a.b.c")).toBe("deep");
        });

        it("should return defaultValue when key doesn't exist", async () => {
            const config = await Config.create({
                configName: "get-default",
                cwd: testDir,
                defaults: {},
            });

            expect(config.get("missing", "fallback")).toBe("fallback");
        });
    });

    describe("getString()", () => {
        it("should return string value", async () => {
            const config = await Config.create({
                configName: "getstring",
                cwd: testDir,
                defaults: { name: "test" },
            });

            expect(config.getString("name")).toBe("test");
        });

        it("should return default when value is not a string", async () => {
            const config = await Config.create({
                configName: "getstring-type",
                cwd: testDir,
                defaults: { num: 42 },
            });

            expect(config.getString("num", "fallback")).toBe("fallback");
        });

        it("should return empty string as default", async () => {
            const config = await Config.create({
                configName: "getstring-empty",
                cwd: testDir,
                defaults: {},
            });

            expect(config.getString("missing")).toBe("");
        });
    });

    describe("getNumber()", () => {
        it("should return number value", async () => {
            const config = await Config.create({
                configName: "getnumber",
                cwd: testDir,
                defaults: { count: 42 },
            });

            expect(config.getNumber("count")).toBe(42);
        });

        it("should return default when value is not a number", async () => {
            const config = await Config.create({
                configName: "getnumber-type",
                cwd: testDir,
                defaults: { str: "hello" },
            });

            expect(config.getNumber("str", 99)).toBe(99);
        });

        it("should return 0 as default", async () => {
            const config = await Config.create({
                configName: "getnumber-zero",
                cwd: testDir,
                defaults: {},
            });

            expect(config.getNumber("missing")).toBe(0);
        });
    });

    describe("getBoolean()", () => {
        it("should return boolean value", async () => {
            const config = await Config.create({
                configName: "getbool",
                cwd: testDir,
                defaults: { enabled: true },
            });

            expect(config.getBoolean("enabled")).toBe(true);
        });

        it("should return default when value is not a boolean", async () => {
            const config = await Config.create({
                configName: "getbool-type",
                cwd: testDir,
                defaults: { str: "yes" },
            });

            expect(config.getBoolean("str", true)).toBe(true);
        });

        it("should return false as default", async () => {
            const config = await Config.create({
                configName: "getbool-false",
                cwd: testDir,
                defaults: {},
            });

            expect(config.getBoolean("missing")).toBe(false);
        });
    });

    describe("set()", () => {
        it("should set simple value", async () => {
            const config = await Config.create({
                configName: "set-simple",
                cwd: testDir,
                defaults: {},
            });

            config.set("key", "value");
            expect(config.get("key")).toBe("value");
        });

        it("should set nested value with dot notation", async () => {
            const config = await Config.create({
                configName: "set-nested",
                cwd: testDir,
                defaults: {},
            });

            config.set("a.b.c", "deep");
            expect(config.get("a.b.c")).toBe("deep");
        });

        it("should merge object argument", async () => {
            const config = await Config.create({
                configName: "set-object",
                cwd: testDir,
                defaults: { existing: true },
            });

            config.set({ new: "value" });
            expect(config.get("existing")).toBe(true);
            expect(config.get("new")).toBe("value");
        });

        it("should throw for non-string keys", async () => {
            const config = await Config.create({
                configName: "set-throw",
                cwd: testDir,
                defaults: {},
            });

            expect(() => config.set(123, "value")).toThrow(TypeError);
        });
    });

    describe("has()", () => {
        it("should return true for existing key", async () => {
            const config = await Config.create({
                configName: "has-exists",
                cwd: testDir,
                defaults: { key: "value" },
            });

            expect(config.has("key")).toBe(true);
        });

        it("should return false for non-existing key", async () => {
            const config = await Config.create({
                configName: "has-missing",
                cwd: testDir,
                defaults: {},
            });

            expect(config.has("missing")).toBe(false);
        });

        it("should check nested keys with dot notation", async () => {
            const config = await Config.create({
                configName: "has-nested",
                cwd: testDir,
                defaults: { a: { b: true } },
            });

            expect(config.has("a.b")).toBe(true);
            expect(config.has("a.c")).toBe(false);
        });
    });

    describe("delete()", () => {
        it("should delete simple key", async () => {
            const config = await Config.create({
                configName: "delete-simple",
                cwd: testDir,
                defaults: { key: "value" },
            });

            config.delete("key");
            expect(config.has("key")).toBe(false);
        });

        it("should delete nested key with dot notation", async () => {
            const config = await Config.create({
                configName: "delete-nested",
                cwd: testDir,
                defaults: { a: { b: "value", c: "keep" } },
            });

            config.delete("a.b");
            expect(config.has("a.b")).toBe(false);
            expect(config.get("a.c")).toBe("keep");
        });
    });

    describe("clear()", () => {
        it("should reset to defaults", async () => {
            const config = await Config.create({
                configName: "clear-test",
                cwd: testDir,
                defaults: { default: true },
            });

            config.set("extra", "value");
            config.clear();

            expect(config.get()).toEqual({ default: true });
        });
    });

    describe("reset()", () => {
        it("should clear the cache", async () => {
            const config = await Config.create({
                configName: "reset-test",
                cwd: testDir,
                defaults: { key: "value" },
            });

            const result = config.reset();
            expect(result).toBe(null);
        });
    });

    describe("reload()", () => {
        it("should reload from disk", async () => {
            const config = await Config.create({
                configName: "reload-test",
                cwd: testDir,
                defaults: { key: "initial" },
            });

            // Modify file directly
            await writeJson(join(testDir, "reload-test.json"), { key: "modified" });

            await config.reload();
            expect(config.get("key")).toBe("modified");
        });
    });
});
