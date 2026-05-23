import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  makeMainEnvironment,
  resolveUserDataPath,
  resolveWorkspaceHome,
} from "./MainEnvironment";

describe("main environment", () => {
  it("resolves workspace home from documents by default", () => {
    expect(
      resolveWorkspaceHome({
        argv: [],
        env: {},
        documentsPath: "/Users/example/Documents",
      }),
    ).toBe("/Users/example/Documents/vexed");
  });

  it("resolves workspace home from VEXED_HOME", () => {
    expect(
      resolveWorkspaceHome({
        argv: [],
        env: { VEXED_HOME: "/tmp/vexed-workspace" },
        documentsPath: "/Users/example/Documents",
      }),
    ).toBe("/tmp/vexed-workspace");
  });

  it("resolves workspace home from --vexed-home before VEXED_HOME", () => {
    expect(
      resolveWorkspaceHome({
        argv: ["vexed", "--vexed-home", "/tmp/from-flag"],
        env: { VEXED_HOME: "/tmp/from-env" },
        documentsPath: "/Users/example/Documents",
      }),
    ).toBe("/tmp/from-flag");

    expect(
      resolveWorkspaceHome({
        argv: ["vexed", "--vexed-home=/tmp/from-equals"],
        env: { VEXED_HOME: "/tmp/from-env" },
        documentsPath: "/Users/example/Documents",
      }),
    ).toBe("/tmp/from-equals");
  });

  it("uses branded app-data directories without a legacy fallback", () => {
    const devPath = resolveUserDataPath({
      isDev: true,
      platform: "darwin",
    });
    const productionPath = resolveUserDataPath({
      isDev: false,
      platform: "darwin",
    });

    expect(devPath).toContain("Application Support");
    expect(devPath).toContain("vexed-dev");
    expect(productionPath).toContain("Application Support");
    expect(productionPath).toContain("vexed");
  });

  it("derives named app-data and workspace paths from one config", () => {
    const env = makeMainEnvironment({
      appDataDir: "/tmp/vexed-app-data",
      workspaceDir: "/tmp/vexed-workspace",
      assetsDir: "/tmp/assets",
      rendererDir: "/tmp/renderer",
      preloadPath: "/tmp/preload.js",
      isDev: false,
      isDarwin: true,
      isWin: false,
      isLinux: false,
    });

    expect(env.logsDir).toBe(join("/tmp/vexed-app-data", "logs"));
    expect(env.appIconPath).toBe(join("/tmp/assets", "icon.png"));
    expect(env.flashRootPath).toBe(
      join(
        "/tmp/vexed-app-data",
        "Pepper Data",
        "Shockwave Flash",
        "WritableRoot",
      ),
    );
    expect(env.flashPluginPath).toBe(
      join("/tmp/vexed-workspace", "PepperFlashPlayer.plugin"),
    );
    expect(env.armyConfigPath("farm")).toBe(
      join("/tmp/vexed-workspace", "army", "farm.yaml"),
    );
    expect(env.scriptsDir).toBe(join("/tmp/vexed-workspace", "scripts"));
  });

  it("uses the dev branded icon path for dev builds", () => {
    const env = makeMainEnvironment({
      appDataDir: "/tmp/vexed-app-data",
      workspaceDir: "/tmp/vexed-workspace",
      assetsDir: "/tmp/assets",
      rendererDir: "/tmp/renderer",
      preloadPath: "/tmp/preload.js",
      isDev: true,
      isDarwin: true,
      isWin: false,
      isLinux: false,
    });

    expect(env.appIconPath).toBe(join("/tmp/assets", "icon-dev.png"));
  });

  it("uses configured Flash plugin path override before platform defaults", () => {
    const env = makeMainEnvironment({
      appDataDir: "/tmp/vexed-app-data",
      workspaceDir: "/tmp/vexed-workspace",
      assetsDir: "/tmp/assets",
      rendererDir: "/tmp/renderer",
      preloadPath: "/tmp/preload.js",
      flashPluginPathOverride: "/opt/pepper/libpepflashplayer.so",
      isDev: false,
      isDarwin: false,
      isWin: false,
      isLinux: true,
    });

    expect(env.flashPluginPath).toBe("/opt/pepper/libpepflashplayer.so");
  });

  it("normalizes tilde workspace paths", () => {
    vi.stubEnv("HOME", "/Users/example");
    try {
      expect(
        resolveWorkspaceHome({
          argv: ["vexed", "--vexed-home", "~/aqw"],
          env: {},
          documentsPath: "/Users/example/Documents",
        }),
      ).toBe("/Users/example/aqw");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
