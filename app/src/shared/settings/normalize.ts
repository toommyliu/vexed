import type { CustomTheme, Settings, ThemeToken } from "./types";

export const COLOR_THEME_TOKENS: ThemeToken[] = [
  "accent",
  "accent-foreground",
  "background",
  "border",
  "card",
  "card-foreground",
  "foreground",
  "muted",
  "muted-foreground",
  "popover",
  "popover-foreground",
  "primary",
  "primary-foreground",
  "ring",
  "secondary",
  "secondary-foreground",
];

const LAUNCH_MODE_SET = new Set<Settings["launchMode"]>([
  "game",
  "manager",
]);
const THEME_MODE_SET = new Set<Settings["theme"]>(["dark", "light", "system"]);
const HEX_COLOR_REGEX = /^#[\da-f]{6}$/iu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneSettings(settings: Settings): Settings {
  return {
    checkForUpdates: settings.checkForUpdates,
    customTheme: isRecord(settings.customTheme)
      ? ({ ...settings.customTheme } as CustomTheme)
      : {},
    debug: settings.debug,
    fallbackServer: settings.fallbackServer,
    launchMode: settings.launchMode,
    theme: settings.theme,
  };
}

function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  return isValidHexColor(trimmed) ? trimmed.toLowerCase() : null;
}

export function coerceSettings(raw: unknown, defaults: Settings): Settings {
  const fallback = cloneSettings(defaults);
  if (!isRecord(raw)) return fallback;
  const customTheme: CustomTheme = isRecord(raw["customTheme"])
    ? (raw["customTheme"] as CustomTheme)
    : {};
  const checkForUpdates =
    typeof raw["checkForUpdates"] === "boolean"
      ? raw["checkForUpdates"]
      : fallback.checkForUpdates;
  const debug =
    typeof raw["debug"] === "boolean" ? raw["debug"] : fallback.debug;
  const fallbackServer =
    typeof raw["fallbackServer"] === "string"
      ? raw["fallbackServer"].trim()
      : fallback.fallbackServer;
  const launchMode =
    typeof raw["launchMode"] === "string" &&
    LAUNCH_MODE_SET.has(raw["launchMode"] as Settings["launchMode"])
      ? (raw["launchMode"] as Settings["launchMode"])
      : fallback.launchMode;
  const theme =
    typeof raw["theme"] === "string" &&
    THEME_MODE_SET.has(raw["theme"] as Settings["theme"])
      ? (raw["theme"] as Settings["theme"])
      : fallback.theme;
  return {
    checkForUpdates,
    customTheme,
    debug,
    fallbackServer,
    launchMode,
    theme,
  };
}
