import { mkdtemp, mkdir, realpath, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readScriptPayload, refreshScriptPayload } from "./scripting";

let tempDir: string | undefined;
let scriptsDir: string | undefined;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "vexed-scripting-"));
  scriptsDir = join(tempDir, "scripts");
});

afterEach(async () => {
  if (tempDir !== undefined) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
    scriptsDir = undefined;
  }
});

describe("main scripting cache", () => {
  it("refreshes cached path-backed scripts from disk", async () => {
    if (scriptsDir === undefined) {
      throw new Error("Missing scripts directory");
    }

    const scriptPath = join(scriptsDir, "farm.js");
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(scriptPath, "module.exports = 'first';\n", "utf8");
    const resolvedScriptPath = await realpath(scriptPath);

    const payload = await readScriptPayload(scriptsDir, scriptPath);
    expect(payload).toMatchObject({
      source: "module.exports = 'first';\n",
      path: resolvedScriptPath,
      name: "farm.js",
    });

    await writeFile(scriptPath, "module.exports = 'second';\n", "utf8");

    const refreshed = await refreshScriptPayload(scriptsDir, payload);
    expect(refreshed).toMatchObject({
      source: "module.exports = 'second';\n",
      path: resolvedScriptPath,
      name: "farm.js",
    });
  });

  it("keeps inline scripts as-is because they have no file cache key", async () => {
    if (scriptsDir === undefined) {
      throw new Error("Missing scripts directory");
    }

    const payload = { source: "module.exports = 1;", name: "inline.js" };

    await expect(refreshScriptPayload(scriptsDir, payload)).resolves.toBe(
      payload,
    );
  });

  it("rejects scripts outside the workspace scripts directory", async () => {
    if (tempDir === undefined || scriptsDir === undefined) {
      throw new Error("Missing temp directory");
    }

    const outsidePath = join(tempDir, "outside.js");
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(outsidePath, "module.exports = 1;\n", "utf8");

    await expect(readScriptPayload(scriptsDir, outsidePath)).rejects.toThrow(
      "Script path must be inside the scripts directory",
    );
  });
});
