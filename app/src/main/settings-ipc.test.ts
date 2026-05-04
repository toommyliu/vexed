import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SettingsIpcChannels } from "../shared/ipc";

const readSource = (path: string) =>
  readFileSync(resolve(import.meta.dirname, path), "utf8");

describe("settings IPC and appearance wiring", () => {
  it("declares typed settings IPC channels", () => {
    expect(SettingsIpcChannels.get).toBe("settings:get");
    expect(SettingsIpcChannels.updatePreferences).toBe(
      "settings:update-preferences",
    );
    expect(SettingsIpcChannels.updateAppearance).toBe(
      "settings:update-appearance",
    );
    expect(SettingsIpcChannels.resetAppearance).toBe(
      "settings:reset-appearance",
    );
    expect(SettingsIpcChannels.changed).toBe("settings:changed");
  });

  it("exposes the settings bridge to renderers", () => {
    const source = readSource("preload.ts");

    expect(source).toContain("SettingsIpcChannels.get");
    expect(source).toContain("settings: {");
    expect(source).toContain("updatePreferences: async");
    expect(source).toContain("updateAppearance: async");
    expect(source).toContain("resetAppearance: async");
    expect(source).toContain("ipcRenderer.on(SettingsIpcChannels.changed");
  });

  it("registers settings IPC handlers through the main entrypoint", () => {
    const indexSource = readSource("index.ts");
    const ipcSource = readSource("settings-ipc.ts");

    expect(indexSource).toContain("registerSettingsIpcHandlers()");
    expect(ipcSource).toContain("ipcMain.handle(SettingsIpcChannels.get");
    expect(ipcSource).toContain(
      "ipcMain.handle(SettingsIpcChannels.updatePreferences",
    );
    expect(ipcSource).toContain(
      "ipcMain.handle(SettingsIpcChannels.updateAppearance",
    );
    expect(ipcSource).toContain(
      "ipcMain.handle(SettingsIpcChannels.resetAppearance",
    );
  });

  it("rejects malformed settings IPC patch payloads", () => {
    const ipcSource = readSource("settings-ipc.ts");

    expect(ipcSource).toContain("Array.isArray(value)");
    expect(ipcSource).toContain(
      "Object.getPrototypeOf(value) !== Object.prototype",
    );
    expect(ipcSource).toContain("throw new Error(`Invalid ${label}`)");
  });

  it("broadcasts settings changes and syncs Electron nativeTheme", () => {
    const indexSource = readSource("index.ts");
    const serviceSource = readSource("settings-service.ts");

    expect(indexSource).toContain("syncNativeTheme(appearance)");
    expect(indexSource).toContain("installNativeThemeChangeBroadcast()");
    expect(serviceSource).toContain(
      "nativeTheme.themeSource = appearance.themeMode",
    );
    expect(serviceSource).toContain('nativeTheme.on("updated"');
    expect(serviceSource).toContain(
      "win.webContents.send(SettingsIpcChannels.changed",
    );
    expect(serviceSource).toContain("syncNativeTheme(settings.appearance)");
  });

  it("wires View > Appearance native menu radio items", () => {
    const source = readSource("menu.ts");

    expect(source).toContain('label: "Appearance"');
    expect(source).toContain('type: "radio"');
    expect(source).toContain('createAppearanceMenuItem("light", "Light"');
    expect(source).toContain('createAppearanceMenuItem("dark", "Dark"');
    expect(source).toContain('createAppearanceMenuItem("system", "System"');
    expect(source).toContain("updateAppearance({ themeMode: mode })");
    expect(source).toContain("onSettingsChanged");
  });
});
