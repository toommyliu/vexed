import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs-extra";
import * as path from "path";
import { tmpdir } from "os";
import {
  pathExists,
  readFile,
  writeFile,
  appendFile,
  ensureFile,
  deleteFile,
} from "../src/file";
import { randomUUID } from "crypto";
import { execSync } from "child_process";

describe("file", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(tmpdir(), `vexed-fs-test-file-${randomUUID()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe("pathExists", () => {
    it("should return true for existing file", async () => {
      const filePath = path.join(testDir, "test.txt");
      await fs.writeFile(filePath, "test");
      const result = await pathExists(filePath);
      expect(result.isOk() && result.unwrap()).toBe(true);
    });

    it("should return false for non-existent path", async () => {
      const result = await pathExists(path.join(testDir, "ghost.txt"));
      expect(result.isOk() && result.unwrap()).toBe(false);
    });
  });

  describe("readFile", () => {
    it("should read content of an existing file", async () => {
      const filePath = path.join(testDir, "read.txt");
      await fs.writeFile(filePath, "hello world");
      const result = await readFile(filePath);
      expect(result.isOk() && result.unwrap()).toBe("hello world");
    });

    it("should read empty file", async () => {
      const filePath = path.join(testDir, "empty.txt");
      await fs.writeFile(filePath, "");
      const result = await readFile(filePath);
      expect(result.isOk() && result.unwrap()).toBe("");
    });

    it("should return error for non-existent file", async () => {
      const result = await readFile(path.join(testDir, "missing.txt"));
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsReadError");
    });

    it("should return error when permission is denied", async () => {
      const filePath = path.join(testDir, "no-read.txt");
      await fs.writeFile(filePath, "secret");
      execSync(`chmod 000 "${filePath}"`);

      try {
        const result = await readFile(filePath);
        expect(result.isErr()).toBe(true);
        expect(result.isErr() && result.error.name).toBe("FsReadError");
      } finally {
        execSync(`chmod 644 "${filePath}"`);
      }
    });
  });

  describe("writeFile", () => {
    it("should write content to a new file and ensure directory", async () => {
      const filePath = path.join(testDir, "subdir/write.txt");
      const result = await writeFile(filePath, "new content");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("new content");
    });

    it("should overwrite existing file", async () => {
      const filePath = path.join(testDir, "overwrite.txt");
      await fs.writeFile(filePath, "old");
      const result = await writeFile(filePath, "new");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("new");
    });

    it("should handle special characters in filename", async () => {
      const filePath = path.join(
        testDir,
        "file with spaces & symbols!@#$%.txt",
      );
      const result = await writeFile(filePath, "content");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("content");
    });

    it("should handle unicode characters in filename", async () => {
      const filePath = path.join(testDir, "文件-📁.txt");
      const result = await writeFile(filePath, "content");
      expect(result.isOk()).toBe(true);
    });

    it("should handle very long paths", async () => {
      const longDir = path.join(testDir, ...Array(50).fill("a"));
      const filePath = path.join(longDir, "file.txt");
      const result = await writeFile(filePath, "content");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("content");
    });

    it("should handle large files", async () => {
      const filePath = path.join(testDir, "large.txt");
      const largeContent = "x".repeat(10 * 1024 * 1024); // 10MB
      const result = await writeFile(filePath, largeContent);
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe(largeContent);
    });

    it("should return error when directory is not writable", async () => {
      const dirPath = path.join(testDir, "readonly-dir");
      await fs.ensureDir(dirPath);
      execSync(`chmod 555 "${dirPath}"`);

      try {
        const filePath = path.join(dirPath, "write.txt");
        const result = await writeFile(filePath, "content");
        expect(result.isErr()).toBe(true);
        expect(result.isErr() && result.error.name).toBe("FsWriteError");
      } finally {
        execSync(`chmod 755 "${dirPath}"`);
      }
    });

    it("should remove stale atomic temp siblings before writing", async () => {
      const filePath = path.join(testDir, "cleanup-stale.json");
      const staleTempPath = `${filePath}.tmp-1234567890abcdef`;
      await fs.writeFile(staleTempPath, "stale");
      const staleDate = new Date(Date.now() - 11 * 60 * 1000);
      await fs.utimes(staleTempPath, staleDate, staleDate);

      const result = await writeFile(filePath, "fresh");

      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("fresh");
      expect(await fs.pathExists(staleTempPath)).toBe(false);
    });

    it("should keep recent atomic temp siblings", async () => {
      const filePath = path.join(testDir, "cleanup-recent.json");
      const recentTempPath = `${filePath}.tmp-1234567890abc123`;
      await fs.writeFile(recentTempPath, "recent");

      const result = await writeFile(filePath, "fresh");

      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("fresh");
      expect(await fs.pathExists(recentTempPath)).toBe(true);
    });

    it("should ignore non-matching temp-like siblings", async () => {
      const filePath = path.join(testDir, "cleanup-ignore.json");
      const nonMatchingPaths = [
        `${filePath}.tmp-invalid`,
        `${filePath}.tmp-123`,
        `${filePath}.tmp-1234567890ABCDEF`,
        `${path.join(testDir, "other.json")}.tmp-1234567890abcdef`,
      ];
      const staleDate = new Date(Date.now() - 11 * 60 * 1000);
      for (const nonMatchingPath of nonMatchingPaths) {
        await fs.writeFile(nonMatchingPath, "keep");
        await fs.utimes(nonMatchingPath, staleDate, staleDate);
      }

      const result = await writeFile(filePath, "fresh");

      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("fresh");
      for (const nonMatchingPath of nonMatchingPaths) {
        expect(await fs.pathExists(nonMatchingPath)).toBe(true);
      }
    });

    it("should not block writes when stale temp cleanup fails", async () => {
      const filePath = path.join(testDir, "cleanup-unlink-failure.json");
      const staleTempPath = `${filePath}.tmp-1234567890abcdef`;
      await fs.writeFile(staleTempPath, "stale");
      const staleDate = new Date(Date.now() - 11 * 60 * 1000);
      await fs.utimes(staleTempPath, staleDate, staleDate);

      const originalUnlink = fs.promises.unlink.bind(fs.promises);
      const unlinkSpy = vi
        .spyOn(fs.promises, "unlink")
        .mockImplementation(async (unlinkPath: any) => {
          if (unlinkPath === staleTempPath) {
            const error = new Error(
              "simulated stale temp cleanup failure",
            ) as NodeJS.ErrnoException;
            error.code = "EPERM";
            throw error;
          }
          return originalUnlink(unlinkPath);
        });

      try {
        const result = await writeFile(filePath, "fresh");

        expect(result.isOk()).toBe(true);
        expect(await fs.readFile(filePath, "utf8")).toBe("fresh");
        expect(await fs.pathExists(staleTempPath)).toBe(true);
      } finally {
        unlinkSpy.mockRestore();
      }
    });
  });

  describe("appendFile", () => {
    it("should append to existing file", async () => {
      const filePath = path.join(testDir, "append.txt");
      await fs.writeFile(filePath, "start");
      const result = await appendFile(filePath, "-end");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("start-end");
    });

    it("should return error when file is read-only", async () => {
      const filePath = path.join(testDir, "readonly-file.txt");
      await fs.writeFile(filePath, "original");
      execSync(`chmod 444 "${filePath}"`);

      try {
        const result = await appendFile(filePath, "append");
        expect(result.isErr()).toBe(true);
        expect(result.isErr() && result.error.name).toBe("FsAppendError");
      } finally {
        execSync(`chmod 644 "${filePath}"`);
      }
    });
  });

  describe("ensureFile", () => {
    it("should create file if it doesn't exist", async () => {
      const filePath = path.join(testDir, "ensure.txt");
      const result = await ensureFile(filePath);
      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(filePath)).toBe(true);
    });

    it("should write default content if new", async () => {
      const filePath = path.join(testDir, "default.txt");
      const result = await ensureFile(filePath, "default");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("default");
    });

    it("should not overwrite if file already exists with content", async () => {
      const filePath = path.join(testDir, "keep.txt");
      await fs.writeFile(filePath, "original");
      const result = await ensureFile(filePath, "default");
      expect(result.isOk()).toBe(true);
      expect(await fs.readFile(filePath, "utf8")).toBe("original");
    });

    it("should handle concurrent writes safely", async () => {
      const filePath = path.join(testDir, "concurrent.txt");
      await fs.writeFile(filePath, "");
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(ensureFile(filePath, `content-${i}`));
      }
      const results = await Promise.all(promises);

      // At least some calls should succeed
      const successCount = results.filter((r) => r.isOk()).length;
      expect(successCount).toBeGreaterThan(0);

      // File should have valid content from one of the successful writes
      const content = await fs.readFile(filePath, "utf8");
      expect(content).toMatch(/^content-\d+$/);
    }, 30000);

    it("should not overwrite existing content with concurrent calls", async () => {
      const filePath = path.join(testDir, "no-overwrite.txt");
      await fs.writeFile(filePath, "original");
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(ensureFile(filePath, `default-${i}`));
      }
      const results = await Promise.all(promises);

      // At least some calls should succeed
      const successCount = results.filter((r) => r.isOk()).length;
      expect(successCount).toBeGreaterThan(0);

      // Original content should remain (race condition prevented)
      expect(await fs.readFile(filePath, "utf8")).toBe("original");
    }, 30000);

    it("should return FsEnsureFileError when path is unreachable (permission denied)", async () => {
      const dirPath = path.join(testDir, "stat-error-dir");
      const filePath = path.join(dirPath, "file.txt");
      await fs.ensureDir(dirPath);
      await fs.writeFile(filePath, "content");
      // Make the directory non-executable to prevent stat on file
      execSync(`chmod 000 "${dirPath}"`);

      try {
        const result = await ensureFile(filePath, "default");
        expect(result.isErr()).toBe(true);
        expect(result.isErr() && result.error.name).toBe("FsEnsureFileError");
      } finally {
        execSync(`chmod 755 "${dirPath}"`);
      }
    });
  });

  describe("deleteFile", () => {
    it("should delete existing file", async () => {
      const filePath = path.join(testDir, "to-delete.txt");
      await fs.writeFile(filePath, "test");
      const result = await deleteFile(filePath);
      expect(result.isOk()).toBe(true);
      expect(await fs.pathExists(filePath)).toBe(false);
    });

    it("should return ok for non-existent file", async () => {
      const result = await deleteFile(path.join(testDir, "already-gone.txt"));
      expect(result.isOk()).toBe(true);
    });

    it("should return error if path is a directory", async () => {
      const dirPath = path.join(testDir, "to-delete-dir");
      await fs.ensureDir(dirPath);
      const result = await deleteFile(dirPath);
      expect(result.isErr()).toBe(true);
      expect(result.isErr() && result.error.name).toBe("FsDeleteFileError");
    });
  });
});
