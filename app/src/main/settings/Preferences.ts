import * as Files from "./Files";
import {
  DEFAULT_COMMAND_OVERLAY_LAYOUT,
  DEFAULT_PREFERENCES,
  type AppLaunchMode,
  type CommandOverlayLayoutSettings,
  type CommandOverlayPreferences,
  type Preferences,
} from "../../shared/settings";

export type { AppLaunchMode, Preferences };

export const DEFAULT: Preferences = DEFAULT_PREFERENCES;

export const isLaunchMode = (value: unknown): value is AppLaunchMode =>
  value === "game" || value === "account-manager";

const normalizeNonNegativeNumber = (
  value: unknown,
  fallback: number,
): number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : fallback;

export const normalizeCommandOverlayLayout = (
  value: unknown,
): CommandOverlayLayoutSettings => {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_COMMAND_OVERLAY_LAYOUT;
  }

  const record = value as Record<string, unknown>;
  const position =
    typeof record["position"] === "object" && record["position"] !== null
      ? (record["position"] as Record<string, unknown>)
      : {};
  const size =
    typeof record["size"] === "object" && record["size"] !== null
      ? (record["size"] as Record<string, unknown>)
      : {};

  return {
    position: {
      x: normalizeNonNegativeNumber(
        position["x"],
        DEFAULT_COMMAND_OVERLAY_LAYOUT.position.x,
      ),
      y: normalizeNonNegativeNumber(
        position["y"],
        DEFAULT_COMMAND_OVERLAY_LAYOUT.position.y,
      ),
    },
    size: {
      width: normalizeNonNegativeNumber(
        size["width"],
        DEFAULT_COMMAND_OVERLAY_LAYOUT.size.width,
      ),
      height: normalizeNonNegativeNumber(
        size["height"],
        DEFAULT_COMMAND_OVERLAY_LAYOUT.size.height,
      ),
    },
    collapsed:
      typeof record["collapsed"] === "boolean"
        ? record["collapsed"]
        : DEFAULT_COMMAND_OVERLAY_LAYOUT.collapsed,
  };
};

const normalizeCommandOverlayPreferences = (
  value: unknown,
): CommandOverlayPreferences => {
  if (typeof value !== "object" || value === null) {
    return DEFAULT.commandOverlay;
  }

  const record = value as Record<string, unknown>;
  return {
    layout: normalizeCommandOverlayLayout(record["layout"]),
  };
};

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
    commandOverlay: normalizeCommandOverlayPreferences(
      record["commandOverlay"],
    ),
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
