import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EnvironmentIpcChannels } from "../shared/ipc";

const readSource = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("environment IPC wiring", () => {
  it("declares typed environment IPC channels", () => {
    expect(EnvironmentIpcChannels.getState).toBe("environment:get-state");
    expect(EnvironmentIpcChannels.addQuest).toBe("environment:add-quest");
    expect(EnvironmentIpcChannels.setQuestReward).toBe(
      "environment:set-quest-reward",
    );
    expect(EnvironmentIpcChannels.setQuestAutoRegister).toBe(
      "environment:set-quest-auto-register",
    );
    expect(EnvironmentIpcChannels.setItemRules).toBe(
      "environment:set-item-rules",
    );
    expect(EnvironmentIpcChannels.fetchBoosts).toBe("environment:fetch-boosts");
    expect(EnvironmentIpcChannels.syncToAll).toBe("environment:sync-to-all");
    expect(EnvironmentIpcChannels.changed).toBe("environment:changed");
  });

  it("exposes granular environment bridge methods to renderers", () => {
    const source = readSource("preload.ts");

    expect(source).toContain("environment: {");
    expect(source).toContain("addQuest: async");
    expect(source).toContain("setQuestReward: async");
    expect(source).toContain("setQuestAutoRegister: async");
    expect(source).toContain("setItemRules: async");
    expect(source).toContain("fetchBoosts: async");
    expect(source).toContain("syncToAll: async");
    expect(source).toContain("onFetchBoostsRequest");
    expect(source).toContain("EnvironmentIpcChannels.changed");
  });

  it("registers main environment handlers through the main entrypoint", () => {
    const indexSource = readSource("index.ts");
    const ipcSource = readSource("environment-ipc.ts");

    expect(indexSource).toContain(
      "registerEnvironmentIpcHandlers(runConfiguredWindowEffect)",
    );
    expect(ipcSource).toContain("EnvironmentIpcChannels.addQuest");
    expect(ipcSource).toContain("EnvironmentIpcChannels.setQuestReward");
    expect(ipcSource).toContain("EnvironmentIpcChannels.setQuestAutoRegister");
    expect(ipcSource).toContain(
      "ipcMain.handle(EnvironmentIpcChannels.fetchBoosts",
    );
    expect(ipcSource).toContain(
      "ipcMain.handle(EnvironmentIpcChannels.syncToAll",
    );
    expect(ipcSource).not.toContain("replaceState");
  });
});
