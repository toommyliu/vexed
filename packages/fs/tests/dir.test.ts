import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import { tmpdir } from "os";
import { ensureDir, deleteDir, readDirRecursive } from "../src/dir";
import { execSync } from "child_process";
import { randomUUID } from "node:crypto";

describe("dir", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `vexed-fs-test-dir-${randomUUID()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe("ensureDir", () => {
    it("should create a new directory", async () => {
      const dirPath = path.join(testDir, "new-dir");
      const result = await ensureDir(dirPath);

      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(dirPath)).toBe(true);
      expect((await fs.stat(dirPath)).isDirectory()).toBe(true);
    });

    it("should handle existing directory", async () => {
      const dirPath = path.join(testDir, "existing-dir");
      await fs.ensureDir(dirPath);

      const result = await ensureDir(dirPath);
      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(dirPath)).toBe(true);
    });

    it("should create nested directories", async () => {
      const dirPath = path.join(testDir, "a/b/c");
      const result = await ensureDir(dirPath);

      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(dirPath)).toBe(true);
    });

    it("should handle deeply nested directories", async () => {
      const deepPath = path.join(
        testDir,
        ...Array(20).fill("level"),
        "file.txt",
      );
      const result = await ensureDir(path.dirname(deepPath));
      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(path.dirname(deepPath))).toBe(true);
    });

    it("should handle special characters in directory name", async () => {
      const dirPath = path.join(testDir, "dir with spaces & symbols!@#$%");
      const result = await ensureDir(dirPath);
      expect(result.isOk()).toBe(true);
    });

    it("should handle unicode in directory name", async () => {
      const dirPath = path.join(testDir, "目录-📁");
      const result = await ensureDir(dirPath);
      expect(result.isOk()).toBe(true);
    });

    it("should return error when permission is denied", async () => {
      const parentDir = path.join(testDir, "no-perms");
      await fs.ensureDir(parentDir);

      // Make parent read-only
      execSync(`chmod 555 "${parentDir}"`);

      try {
        const dirPath = path.join(parentDir, "child");
        const result = await ensureDir(dirPath);

        expect(result.isErr()).toBe(true);
        expect(result.isErr() && result.error.name).toBe("FsEnsureDirError");
      } finally {
        // Restore permissions for cleanup
        execSync(`chmod 755 "${parentDir}"`);
      }
    });
  });

  describe("deleteDir", () => {
    it("should delete an existing directory with content", async () => {
      const dirPath = path.join(testDir, "to-delete");
      await fs.ensureDir(dirPath);
      await fs.writeFile(path.join(dirPath, "file.txt"), "hello");

      const result = await deleteDir(dirPath);
      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(dirPath)).toBe(false);
    });

    it("should delete empty directory", async () => {
      const dirPath = path.join(testDir, "empty-dir");
      await fs.ensureDir(dirPath);
      const result = await deleteDir(dirPath);
      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(dirPath)).toBe(false);
    });

    it("should return error if path is not a directory", async () => {
      const filePath = path.join(testDir, "not-a-dir.txt");
      await fs.writeFile(filePath, "test");

      const result = await deleteDir(filePath);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsDeleteDirError");
      expect(result.isErr() && result.error.message).toContain(
        "exists but is not a directory",
      );
    });

    it("should return ok for non-existent directory", async () => {
      const nonExistent = path.join(testDir, "does-not-exist");
      const result = await deleteDir(nonExistent);
      expect(result.isOk()).toBe(true);
    });
  });

  describe("readDirRecursive", () => {
    beforeEach(async () => {
      await fs.ensureDir(path.join(testDir, "a/b"));
      await fs.writeFile(path.join(testDir, "file1.txt"), "1");
      await fs.writeFile(path.join(testDir, "a/file2.txt"), "2");
      await fs.writeFile(path.join(testDir, "a/b/file3.txt"), "3");
    });

    it("should list all files in a nested structure", async () => {
      const result = await readDirRecursive(testDir);
      expect(result.isOk()).toBe(true);
      const files = result.unwrap();
      expect(files).toHaveLength(3);

      const basenames = files.map((f) => path.basename(f));
      expect(basenames).toContain("file1.txt");
      expect(basenames).toContain("file2.txt");
      expect(basenames).toContain("file3.txt");
    });

    it("should apply custom filter", async () => {
      const result = await readDirRecursive(testDir, {
        filter: (name) => path.basename(name) === "file2.txt",
      });
      expect(result.isOk()).toBe(true);
      const files = result.unwrap();
      expect(files).toHaveLength(1);
      expect(files[0]).toContain("file2.txt");
    });

    it("should handle many files in directory", async () => {
      const dirPath = path.join(testDir, "many-files");
      await fs.ensureDir(dirPath);

      // Create 100 files
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(fs.writeFile(path.join(dirPath, `file${i}.txt`), `${i}`));
      }
      await Promise.all(promises);

      const result = await readDirRecursive(dirPath);
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toHaveLength(100);
    });

    it("should return error for non-existent directory", async () => {
      const result = await readDirRecursive(path.join(testDir, "ghost"));
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsReadDirError");
    });
  });
});
