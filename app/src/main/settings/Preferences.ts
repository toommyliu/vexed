import {
  DEFAULT_PREFERENCES,
  type AppLaunchMode,
  type Preferences,
} from "../../shared/settings";

export type { AppLaunchMode, Preferences };

export const DEFAULT: Preferences = DEFAULT_PREFERENCES;

export const isLaunchMode = (value: unknown): value is AppLaunchMode =>
  value === "game" || value === "account-manager";

export const normalize = (value: unknown): Preferences => {
  if (typeof value !== "object" || value === null) {
    return DEFAULT;
  }

  const record = value as Record<string, unknown>;

  return {
    checkForUpdates:
      typeof record["checkForUpdates"] === "boolean"
        ? record["checkForUpdates"]
        : DEFAULT.checkForUpdates,
    launchMode: isLaunchMode(record["launchMode"])
      ? record["launchMode"]
      : DEFAULT.launchMode,
  };
};

export const fileName = "preferences.json";

export const serialize = (preferences: Preferences): Preferences =>
  normalize(preferences);
