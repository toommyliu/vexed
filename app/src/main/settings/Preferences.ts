import * as Files from "./Files";
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

export const path = (): string => Files.join("preferences.yaml");

export const read = (): Preferences => normalize(Files.readYaml(path()));

export const write = (preferences: Preferences): void => {
  Files.writeYaml(path(), normalize(preferences));
};

export const ensure = (): Preferences =>
  Files.ensureYaml(path(), DEFAULT, normalize);
