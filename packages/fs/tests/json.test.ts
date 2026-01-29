import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import { tmpdir } from "os";
import { readJson, writeJson, ensureJsonFile } from "../src/json";
import { randomUUID } from "crypto";

describe("json", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `vexed-fs-test-json-${randomUUID()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe("readJson", () => {
    it("should parse valid JSON file", async () => {
      const filePath = path.join(testDir, "valid.json");
      const data = { foo: "bar", baz: 123 };
      await fs.writeJson(filePath, data);

      const result = await readJson(filePath);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toEqual(data);
    });

    it("should read empty object", async () => {
      const filePath = path.join(testDir, "empty.json");
      await fs.writeJson(filePath, {});
      const result = await readJson(filePath);
      expect(result.isOk() && result.unwrap()).toEqual({});
    });

    it("should read empty array", async () => {
      const filePath = path.join(testDir, "empty-array.json");
      await fs.writeJson(filePath, []);
      const result = await readJson(filePath);
      expect(result.isOk() && result.unwrap()).toEqual([]);
    });

    it("should return FsJsonParseError for invalid JSON", async () => {
      const filePath = path.join(testDir, "invalid.json");
      await fs.writeFile(filePath, "{ invalid json }");

      const result = await readJson(filePath);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsJsonParseError");
    });

    it("should return FsJsonParseError for trailing comma", async () => {
      const filePath = path.join(testDir, "trailing-comma.json");
      await fs.writeFile(filePath, '{"key": "value",}');
      const result = await readJson(filePath);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsJsonParseError");
    });

    it("should return FsJsonParseError for comments in JSON", async () => {
      const filePath = path.join(testDir, "comments.json");
      await fs.writeFile(filePath, '{"key": "value" /* comment */}');
      const result = await readJson(filePath);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsJsonParseError");
    });

    it("should return FsReadError for missing file", async () => {
      const result = await readJson(path.join(testDir, "missing.json"));
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsReadError");
    });
  });

  describe("writeJson", () => {
    it("should serialize and write object to file", async () => {
      const filePath = path.join(testDir, "write.json");
      const data = { hello: "world" };
      const result = await writeJson(filePath, data);

      expect(result.isOk()).toBe(true);
      const read = await fs.readJson(filePath);
      expect(read).toEqual(data);
    });

    it("should respect indentation", async () => {
      const filePath = path.join(testDir, "indent.json");
      const data = { a: 1 };
      await writeJson(filePath, data, 4);
      const content = await fs.readFile(filePath, "utf8");
      expect(content).toContain("    ");
    });

    it("should return FsJsonSerializeError for circular references", async () => {
      const filePath = path.join(testDir, "circular.json");
      const circular: any = { name: "test" };
      circular.self = circular;
      const result = await writeJson(filePath, circular);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsJsonSerializeError");
    });

    it("should handle non-serializable objects (functions become undefined)", async () => {
      const filePath = path.join(testDir, "function.json");
      const data = { fn: () => {} };

      const result = await writeJson(filePath, data);
      expect(result.isOk()).toBe(true);
      const read = await fs.readJson(filePath);
      expect(read.fn).toBeUndefined();
    });

    it("should handle symbols (become undefined)", async () => {
      const filePath = path.join(testDir, "symbol.json");
      const data = { sym: Symbol("test") };

      const result = await writeJson(filePath, data);
      expect(result.isOk()).toBe(true);
      const read = await fs.readJson(filePath);
      expect(read.sym).toBeUndefined();
    });

    it("should return FsJsonSerializeError for objects with throwing getters", async () => {
      const filePath = path.join(testDir, "throwing-getter.json");
      const data = {
        get thrower() {
          throw new Error("Getter error");
        },
      };

      const result = await writeJson(filePath, data);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsJsonSerializeError");
    });
  });

  describe("ensureJsonFile", () => {
    it("should create with default content if missing", async () => {
      const filePath = path.join(testDir, "ensure.json");
      const defaultValue = { enabled: true };
      const result = await ensureJsonFile(filePath, defaultValue);
      expect(result.isOk()).toBe(true);
      const read = await fs.readJson(filePath);
      expect(read).toEqual(defaultValue);
    });

    it("should skip if exists", async () => {
      const filePath = path.join(testDir, "skip.json");
      const existing = { v: 1 };
      await fs.writeJson(filePath, existing);
      const result = await ensureJsonFile(filePath, { v: 2 });
      expect(result.isOk()).toBe(true);
      const read = await fs.readJson(filePath);
      expect(read).toEqual(existing);
    });

    it("should return FsEnsureFileError if path is already a directory", async () => {
      // Try to ensure a json file at a path that is already a directory
      const dirPath = path.join(testDir, "existing-dir");
      await fs.ensureDir(dirPath);

      const result = await ensureJsonFile(dirPath, {});
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsEnsureFileError");
    });
  });
});
