import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CombatProfilesIpcChannels } from "../shared/ipc";

const readSource = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("combat profile IPC wiring", () => {
  it("declares typed combat profile IPC channels", () => {
    expect(CombatProfilesIpcChannels.getState).toBe(
      "combat-profiles:get-state",
    );
    expect(CombatProfilesIpcChannels.saveProfile).toBe(
      "combat-profiles:save-profile",
    );
    expect(CombatProfilesIpcChannels.deleteProfile).toBe(
      "combat-profiles:delete-profile",
    );
    expect(CombatProfilesIpcChannels.setAutoAttack).toBe(
      "combat-profiles:set-auto-attack",
    );
    expect(CombatProfilesIpcChannels.changed).toBe("combat-profiles:changed");
  });

  it("exposes the combat profile bridge to renderers", () => {
    const source = readSource("preload.ts");

    expect(source).toContain("CombatProfilesIpcChannels.getState");
    expect(source).toContain("combatProfiles: {");
    expect(source).toContain("saveProfile: async");
    expect(source).toContain("deleteProfile: async");
    expect(source).toContain("setAutoAttack: async");
    expect(source).toContain(
      "ipcRenderer.on(CombatProfilesIpcChannels.changed",
    );
  });

  it("registers combat profile IPC handlers through the main entrypoint", () => {
    const indexSource = readSource("index.ts");
    const ipcSource = readSource("combat-profiles-ipc.ts");

    expect(indexSource).toContain("registerCombatProfilesIpcHandlers()");
    expect(ipcSource).toContain(
      "ipcMain.handle(CombatProfilesIpcChannels.getState",
    );
    expect(ipcSource).toContain(
      "ipcMain.handle(CombatProfilesIpcChannels.saveProfile",
    );
    expect(ipcSource).toContain(
      "ipcMain.handle(CombatProfilesIpcChannels.deleteProfile",
    );
    expect(ipcSource).toContain(
      "ipcMain.handle(CombatProfilesIpcChannels.setAutoAttack",
    );
  });
});
