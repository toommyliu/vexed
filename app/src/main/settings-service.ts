import { BrowserWindow, nativeTheme } from "electron";
import { SettingsIpcChannels } from "../shared/ipc";
import {
  THEME_TOKEN_NAMES,
  type AppSettings,
  type Appearance,
  type AppearancePatch,
  type Preferences,
  type PreferencesPatch,
  type ThemeMode,
  type ThemeProfile,
  type ThemeProfilePatch,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeVariant,
} from "../shared/settings";
import * as AppearanceSettings from "./settings/Appearance";
import * as PreferencesSettings from "./settings/Preferences";

type SettingsChangeListener = (settings: AppSettings) => void;

const themeTokenNames = new Set<string>(THEME_TOKEN_NAMES);
const settingsChangeListeners = new Set<SettingsChangeListener>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const isThemeVariant = (value: string): value is ThemeVariant =>
  value === "light" || value === "dark";

const isThemeTokenName = (value: string): value is ThemeTokenName =>
  themeTokenNames.has(value);

const normalizeRgb = (value: unknown): ThemeRgb | null => {
  if (!Array.isArray(value) || value.length !== 3) {
    return null;
  }

  const [red, green, blue] = value;
  if (
    !Number.isInteger(red) ||
    !Number.isInteger(green) ||
    !Number.isInteger(blue) ||
    red < 0 ||
    red > 255 ||
    green < 0 ||
    green > 255 ||
    blue < 0 ||
    blue > 255
  ) {
    return null;
  }

  return [red, green, blue];
};

const normalizeFont = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const font = value.trim();
  return font.length > 0 && font.length <= 256 ? font : null;
};

const normalizeRounding = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(2, Math.max(0, value));
};

const applyThemeProfilePatch = (
  profile: ThemeProfile,
  patch: ThemeProfilePatch,
): ThemeProfile => {
  const tokens: Partial<Record<ThemeTokenName, ThemeRgb>> = {
    ...profile.tokens,
  };

  if (isRecord(patch.tokens)) {
    for (const [name, rawValue] of Object.entries(patch.tokens)) {
      if (!isThemeTokenName(name)) {
        continue;
      }

      if (rawValue === null) {
        delete tokens[name];
        continue;
      }

      const value = normalizeRgb(rawValue);
      if (value) {
        tokens[name] = value;
      }
    }
  }

  return {
    tokens,
    sansFont: normalizeFont(patch.sansFont) ?? profile.sansFont,
    monoFont: normalizeFont(patch.monoFont) ?? profile.monoFont,
    rounding: normalizeRounding(patch.rounding) ?? profile.rounding,
  };
};

export const readSettings = (): AppSettings => ({
  preferences: PreferencesSettings.ensure(),
  appearance: AppearanceSettings.ensure(),
});

export const syncNativeTheme = (appearance: Appearance): void => {
  nativeTheme.themeSource = appearance.themeMode;
};

export const broadcastSettings = (settings: AppSettings): void => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.isDestroyed() || win.webContents.isDestroyed()) {
      continue;
    }

    win.webContents.send(SettingsIpcChannels.changed, settings);
  }
};

const publishSettings = (settings: AppSettings): AppSettings => {
  syncNativeTheme(settings.appearance);
  broadcastSettings(settings);

  for (const listener of settingsChangeListeners) {
    listener(settings);
  }

  return settings;
};

export const onSettingsChanged = (
  listener: SettingsChangeListener,
): (() => void) => {
  settingsChangeListeners.add(listener);

  return () => {
    settingsChangeListeners.delete(listener);
  };
};

export const updatePreferences = (patch: PreferencesPatch): AppSettings => {
  const current = PreferencesSettings.read();
  const next: Preferences = {
    checkForUpdates:
      typeof patch.checkForUpdates === "boolean"
        ? patch.checkForUpdates
        : current.checkForUpdates,
    launchMode: PreferencesSettings.isLaunchMode(patch.launchMode)
      ? patch.launchMode
      : current.launchMode,
  };

  PreferencesSettings.write(next);
  return publishSettings(readSettings());
};

export const updateAppearance = (patch: AppearancePatch): AppSettings => {
  const current = AppearanceSettings.read();
  let light = current.themes.light;
  let dark = current.themes.dark;

  if (isRecord(patch.themes)) {
    for (const [variant, profilePatch] of Object.entries(patch.themes)) {
      if (!isThemeVariant(variant) || !isRecord(profilePatch)) {
        continue;
      }

      if (variant === "light") {
        light = applyThemeProfilePatch(light, profilePatch);
      } else {
        dark = applyThemeProfilePatch(dark, profilePatch);
      }
    }
  }

  const next: Appearance = {
    themeMode: isThemeMode(patch.themeMode)
      ? patch.themeMode
      : current.themeMode,
    themes: {
      light,
      dark,
    },
  };

  AppearanceSettings.write(next);
  return publishSettings(readSettings());
};

export const resetAppearance = (): AppSettings => {
  AppearanceSettings.write(AppearanceSettings.DEFAULT);
  return publishSettings(readSettings());
};

export const installNativeThemeChangeBroadcast = (): void => {
  nativeTheme.on("updated", () => {
    broadcastSettings(readSettings());
  });
};
