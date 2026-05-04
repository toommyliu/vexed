import * as Files from "./Files";

export type AppLaunchMode = "game" | "account-manager";

export interface Preferences {
  readonly checkForUpdates: boolean;
  readonly launchMode: AppLaunchMode;
}

export const DEFAULT: Preferences = {
  checkForUpdates: true,
  launchMode: "game",
};

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

export const path = (): string => Files.join("preferences.json");

export const read = (): Preferences => normalize(Files.readJson(path()));

export const write = (preferences: Preferences): void => {
  Files.writeJson(path(), normalize(preferences));
};

export const ensure = (): Preferences =>
  Files.ensureJson(path(), DEFAULT, normalize);
