import * as Files from "./Files";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_THEME_PROFILE,
  THEME_TOKEN_NAMES,
  type Appearance,
  type ThemeMode,
  type ThemeProfile,
  type ThemeRgb,
  type ThemeTokenName,
} from "../../shared/settings";

export {
  THEME_TOKEN_NAMES,
  type Appearance,
  type ThemeMode,
  type ThemeProfile,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeVariant,
} from "../../shared/settings";

export const DEFAULT: Appearance = DEFAULT_APPEARANCE;

const themeTokenNames = new Set<string>(THEME_TOKEN_NAMES);

const isThemeMode = (value: unknown): value is ThemeMode =>
  value === "light" || value === "dark" || value === "system";

export const normalizeRgb = (value: unknown): ThemeRgb | undefined => {
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

export const normalizeFont = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const font = value.trim();
  return font.length > 0 && font.length <= 256 ? font : undefined;
};

export const normalizeRounding = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(2, Math.max(0, value));
};

const normalizeThemeProfile = (value: unknown): ThemeProfile => {
  if (typeof value !== "object" || value === null) {
    return DEFAULT_THEME_PROFILE;
  }

  const record = value as Record<string, unknown>;

  return {
    tokens: normalizeTokens(record["tokens"]),
    sansFont:
      normalizeFont(record["sansFont"]) ?? DEFAULT_THEME_PROFILE.sansFont,
    monoFont:
      normalizeFont(record["monoFont"]) ?? DEFAULT_THEME_PROFILE.monoFont,
    rounding:
      normalizeRounding(record["rounding"]) ?? DEFAULT_THEME_PROFILE.rounding,
  };
};

export const normalize = (value: unknown): Appearance => {
  if (typeof value !== "object" || value === null) {
    return DEFAULT;
  }

  const record = value as Record<string, unknown>;
  const rawThemes =
    typeof record["themes"] === "object" && record["themes"] !== null
      ? (record["themes"] as Record<string, unknown>)
      : {};

  return {
    themeMode: isThemeMode(record["themeMode"])
      ? record["themeMode"]
      : DEFAULT.themeMode,
    themes: {
      light: normalizeThemeProfile(rawThemes["light"]),
      dark: normalizeThemeProfile(rawThemes["dark"]),
    },
  };
};

export const path = (): string => Files.join("appearance.json");

export const read = (): Appearance => normalize(Files.readJson(path()));

export const write = (appearance: Appearance): void => {
  Files.writeJson(path(), normalize(appearance));
};

export const ensure = (): Appearance =>
  Files.ensureJson(path(), DEFAULT, normalize);
