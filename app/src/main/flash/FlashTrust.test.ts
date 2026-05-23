import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import {
  FlashTrustError,
  getFlashPlayerConfigFolder,
  getFlashPlayerFolder,
  initSync,
  makeFlashTrust,
  resolvePepperFlashPluginPath,
  resolvePepperFlashWritableRootPath,
  trustOnlySync,
} from "./FlashTrust";

const tempDirs: string[] = [];

const makeTempDir = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "vexed-flash-trust-"));
  tempDirs.push(dir);
  return dir;
};

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) =>
      rm(dir, {
        force: true,
        recursive: true,
      }),
    ),
  );
});

describe("flash trust paths", () => {
  it("resolves platform-specific Flash Player folders", () => {
    expect(
      getFlashPlayerFolder({
        platform: "darwin",
        env: { HOME: "/Users/example" },
        homeDir: "/fallback",
      }),
    ).toBe(
      join(
        "/Users/example",
        "Library",
        "Preferences",
        "Macromedia",
        "Flash Player",
      ),
    );

    expect(
      getFlashPlayerFolder({
        platform: "linux",
        env: { HOME: "/home/example" },
        homeDir: "/fallback",
      }),
    ).toBe(join("/home/example", ".macromedia", "Flash_Player"));

    expect(
      getFlashPlayerFolder({
        platform: "win32",
        env: {
          APPDATA: "C:\\Users\\example\\AppData\\Roaming",
          USERPROFILE: "C:\\Users\\example",
        },
        homeDir: "/fallback",
        osRelease: "10.0.0",
      }),
    ).toBe(
      join(
        "C:\\Users\\example\\AppData\\Roaming",
        "Macromedia",
        "Flash Player",
      ),
    );
  });

  it("resolves the XP Flash Player folder from USERPROFILE", () => {
    expect(
      getFlashPlayerFolder({
        platform: "win32",
        env: { USERPROFILE: "C:\\Documents and Settings\\example" },
        homeDir: "/fallback",
        osRelease: "5.1.0",
      }),
    ).toBe(
      join(
        "C:\\Documents and Settings\\example",
        "Application Data",
        "Macromedia",
        "Flash Player",
      ),
    );
  });

  it("derives Flash trust and Pepper Flash paths", () => {
    expect(getFlashPlayerConfigFolder("/tmp/flash-root")).toBe(
      join("/tmp/flash-root", "#Security", "FlashPlayerTrust"),
    );
    expect(resolvePepperFlashWritableRootPath("/tmp/app-data")).toBe(
      join("/tmp/app-data", "Pepper Data", "Shockwave Flash", "WritableRoot"),
    );
    expect(resolvePepperFlashPluginPath("/tmp/workspace", "darwin")).toBe(
      join("/tmp/workspace", "PepperFlashPlayer.plugin"),
    );
    expect(resolvePepperFlashPluginPath("/tmp/workspace", "win32")).toBe(
      join("/tmp/workspace", "pepflashplayer.dll"),
    );
    expect(resolvePepperFlashPluginPath("/tmp/workspace", "linux")).toBe(
      join("/tmp/workspace", "libpepflashplayer.so"),
    );
  });
});

describe("flash trust manager", () => {
  it("rejects invalid app names", async () => {
    const root = await makeTempDir();

    expect(() => initSync("", { customFolder: root })).toThrow(FlashTrustError);
    expect(() => initSync("../vexed", { customFolder: root })).toThrow(
      FlashTrustError,
    );
  });

  it("dedupes trusted paths and clears the trust config file", async () => {
    const root = await makeTempDir();
    const loaderPath = join(root, "loader.swf");
    const manager = initSync("vexed", { customFolder: root });
    const configPath = join(root, "#Security", "FlashPlayerTrust", "vexed.cfg");

    expect(existsSync(configPath)).toBe(false);
    manager.add(loaderPath);
    manager.add(loaderPath);

    expect(manager.isTrusted(loaderPath)).toBe(true);
    expect(manager.list()).toEqual([loaderPath]);
    expect(readFileSync(configPath, "utf8")).toBe(loaderPath);

    manager.remove(loaderPath);
    expect(manager.list()).toEqual([]);
    expect(readFileSync(configPath, "utf8")).toBe("");
  });

  it("loads an existing config and removes empty trailing lines", async () => {
    const root = await makeTempDir();
    const configDir = join(root, "#Security", "FlashPlayerTrust");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(
      join(configDir, "vexed.cfg"),
      ["/trusted/one.swf", "/trusted/two.swf", ""].join("\n"),
      "utf8",
    );

    const manager = initSync("vexed", { customFolder: root });

    expect(manager.list()).toEqual(["/trusted/one.swf", "/trusted/two.swf"]);

    manager.empty();
    expect(readFileSync(join(configDir, "vexed.cfg"), "utf8")).toBe("");
  });

  it("replaces trusted paths and reads them back through the async manager", async () => {
    const root = await makeTempDir();
    const configPath = join(root, "#Security", "FlashPlayerTrust", "vexed.cfg");
    const flashTrust = makeFlashTrust();

    await Effect.runPromise(
      flashTrust.trustOnly("vexed", ["/trusted/one.swf", "/trusted/two.swf"], {
        customFolder: root,
      }),
    );

    expect(readFileSync(configPath, "utf8")).toBe(
      ["/trusted/one.swf", "/trusted/two.swf"].join("\n"),
    );

    const manager = await Effect.runPromise(
      flashTrust.init("vexed", { customFolder: root }),
    );

    expect(await Effect.runPromise(manager.list)).toEqual([
      "/trusted/one.swf",
      "/trusted/two.swf",
    ]);
    expect(await Effect.runPromise(manager.isTrusted("/trusted/one.swf"))).toBe(
      true,
    );
  });

  it("replaces trusted paths during startup before Electron services are available", async () => {
    const root = await makeTempDir();
    const configPath = join(root, "#Security", "FlashPlayerTrust", "vexed.cfg");

    trustOnlySync("vexed", ["/trusted/loader.swf"], { customFolder: root });

    expect(readFileSync(configPath, "utf8")).toBe("/trusted/loader.swf");
  });
});
