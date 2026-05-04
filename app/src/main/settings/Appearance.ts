import * as Files from "./Files";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeVariant = "light" | "dark";
export type ThemeRgb = readonly [number, number, number];

export const THEME_TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "cardForeground",
  "popover",
  "popoverForeground",
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "muted",
  "mutedForeground",
  "accent",
  "accentForeground",
  "destructive",
  "destructiveForeground",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "info",
  "infoForeground",
  "border",
  "input",
  "ring",
] as const;

export type ThemeTokenName = (typeof THEME_TOKEN_NAMES)[number];

export interface ThemeTokenOverrides {
  readonly light: Partial<Record<ThemeTokenName, ThemeRgb>>;
  readonly dark: Partial<Record<ThemeTokenName, ThemeRgb>>;
}

export interface Appearance {
  readonly themeMode: ThemeMode;
  readonly tokenOverrides: ThemeTokenOverrides;
}

export const DEFAULT: Appearance = {
  themeMode: "dark",
  tokenOverrides: {
    light: {},
    dark: {},
  },
};

const themeTokenNames = new Set<string>(THEME_TOKEN_NAMES);

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

const normalizeRgb = (value: unknown): ThemeRgb | undefined => {
  if (!Array.isArray(value) || value.length !== 3) {
    return undefined;
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
    return undefined;
  }

  return [red, green, blue];
};

const normalizeTokens = (
  value: unknown,
): Partial<Record<ThemeTokenName, ThemeRgb>> => {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const tokens: Partial<Record<ThemeTokenName, ThemeRgb>> = {};
  for (const [key, rawToken] of Object.entries(value)) {
    if (!themeTokenNames.has(key)) {
      continue;
    }

    const token = normalizeRgb(rawToken);
    if (token !== undefined) {
      tokens[key as ThemeTokenName] = token;
    }
  }

  return tokens;
};

export const normalize = (value: unknown): Appearance => {
  if (typeof value !== "object" || value === null) {
    return DEFAULT;
  }

  const record = value as Record<string, unknown>;
  const rawTokenOverrides =
    typeof record["tokenOverrides"] === "object" &&
    record["tokenOverrides"] !== null
      ? (record["tokenOverrides"] as Record<string, unknown>)
      : {};

  return {
    themeMode: isThemeMode(record["themeMode"])
      ? record["themeMode"]
      : DEFAULT.themeMode,
    tokenOverrides: {
      light: normalizeTokens(rawTokenOverrides["light"]),
      dark: normalizeTokens(rawTokenOverrides["dark"]),
    },
  };
};

export const path = (): string => Files.join("appearance.json");

export const read = (): Appearance => normalize(Files.readJson(path()));

export const write = (appearance: Appearance): void => {
  Files.writeJson(path(), normalize(appearance));
};

export const ensure = (): Appearance => Files.ensureJson(path(), DEFAULT, normalize);
