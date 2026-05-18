import { mkdtemp, mkdir, realpath, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as Files from "./settings/Files";
import {
  refreshCachedScriptPayload,
  updateCachedScriptPayload,
} from "./scripting";

let tempDir: string | undefined;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "vexed-scripting-"));
  Files.configureWorkspaceHome(tempDir);
});

afterEach(async () => {
  Files.resetPathConfigurationForTests();
  if (tempDir !== undefined) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("main scripting cache", () => {
  it("refreshes cached path-backed scripts from disk", async () => {
    const scriptsDir = Files.workspaceJoin("scripts");
    const scriptPath = join(scriptsDir, "farm.js");
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(scriptPath, "module.exports = 'first';\n", "utf8");
    const resolvedScriptPath = await realpath(scriptPath);

    const payload = await updateCachedScriptPayload(scriptPath);
    expect(payload).toMatchObject({
      source: "module.exports = 'first';\n",
      path: resolvedScriptPath,
      name: "farm.js",
    });

    await writeFile(scriptPath, "module.exports = 'second';\n", "utf8");

    const refreshed = await refreshCachedScriptPayload(payload);
    expect(refreshed).toMatchObject({
      source: "module.exports = 'second';\n",
      path: resolvedScriptPath,
      name: "farm.js",
    });
  });

  it("keeps inline scripts as-is because they have no file cache key", async () => {
    const payload = { source: "module.exports = 1;", name: "inline.js" };

    await expect(refreshCachedScriptPayload(payload)).resolves.toBe(payload);
  });

  it("rejects scripts outside the workspace scripts directory", async () => {
    if (tempDir === undefined) {
      throw new Error("Missing temp directory");
    }

    const scriptsDir = Files.workspaceJoin("scripts");
    const outsidePath = join(tempDir, "outside.js");
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(outsidePath, "module.exports = 1;\n", "utf8");

    await expect(updateCachedScriptPayload(outsidePath)).rejects.toThrow(
      "Script path must be inside the scripts directory",
    );
  });
});
