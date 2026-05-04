import { ipcMain } from "electron";
import { SettingsIpcChannels } from "../shared/ipc";
import type { AppearancePatch, PreferencesPatch } from "../shared/settings";
import {
  readSettings,
  resetAppearance,
  updateAppearance,
  updatePreferences,
} from "./settings-service";

let settingsIpcRegistered = false;

const requireRecord = (
  value: unknown,
  label: string,
): Record<string, unknown> => {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Invalid ${label}`);
  }

  return value as Record<string, unknown>;
};

export const registerSettingsIpcHandlers = (): void => {
  if (settingsIpcRegistered) {
    return;
  }

  ipcMain.handle(SettingsIpcChannels.get, () => readSettings());

  ipcMain.handle(SettingsIpcChannels.updatePreferences, (_event, patch) =>
    updatePreferences(
      requireRecord(patch, "preferences patch") as PreferencesPatch,
    ),
  );

  ipcMain.handle(SettingsIpcChannels.updateAppearance, (_event, patch) =>
    updateAppearance(
      requireRecord(patch, "appearance patch") as AppearancePatch,
    ),
  );

  ipcMain.handle(SettingsIpcChannels.resetAppearance, () => resetAppearance());

  settingsIpcRegistered = true;
};
