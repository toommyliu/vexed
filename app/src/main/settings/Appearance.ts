import { rgbToHex } from "../../shared/appearance-snapshot";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_THEME_PROFILE,
  THEME_TOKEN_NAMES,
  isMotionMode,
  type Appearance,
  type ThemeMode,
  type ThemeProfile,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeVariant,
} from "../../shared/settings";

export {
  THEME_TOKEN_NAMES,
  isMotionMode,
  type Appearance,
  type MotionMode,
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

const parseHexRgb = (value: string): ThemeRgb | undefined => {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  if (match === null) {
    return undefined;
  }

  const hex = match[1];
  if (hex === undefined) {
    return undefined;
  }

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
};

export const normalizeRgb = (value: unknown): ThemeRgb | undefined => {
  if (typeof value === "string") {
    return parseHexRgb(value);
  }

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

export const normalizeFontSize = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.min(24, Math.max(10, Math.round(value)));
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
    sansFontSize:
      normalizeFontSize(record["sansFontSize"]) ??
      DEFAULT_THEME_PROFILE.sansFontSize,
    monoFontSize:
      normalizeFontSize(record["monoFontSize"]) ??
      DEFAULT_THEME_PROFILE.monoFontSize,
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
    reduceMotion: isMotionMode(record["reduceMotion"])
      ? record["reduceMotion"]
      : DEFAULT.reduceMotion,
    useCursorPointers:
      typeof record["useCursorPointers"] === "boolean"
        ? record["useCursorPointers"]
        : DEFAULT.useCursorPointers,
    themes: {
      light: normalizeThemeProfile(rawThemes["light"]),
      dark: normalizeThemeProfile(rawThemes["dark"]),
    },
  };
};

type PersistedThemeProfile = Omit<ThemeProfile, "tokens"> & {
  readonly tokens: Partial<Record<ThemeTokenName, string>>;
};

type PersistedAppearance = Omit<Appearance, "themes"> & {
  readonly themes: Record<ThemeVariant, PersistedThemeProfile>;
};

const serializeTokens = (
  tokens: Partial<Record<ThemeTokenName, ThemeRgb>>,
): Partial<Record<ThemeTokenName, string>> => {
  const serialized: Partial<Record<ThemeTokenName, string>> = {};
  for (const [name, rgb] of Object.entries(tokens)) {
    const tokenName = name as ThemeTokenName;
    const token = normalizeRgb(rgb);
    if (token !== undefined) {
      serialized[tokenName] = rgbToHex(token);
    }
  }

  return serialized;
};

const serializeThemeProfile = (
  profile: ThemeProfile,
): PersistedThemeProfile => ({
  tokens: serializeTokens(profile.tokens),
  sansFont: profile.sansFont,
  monoFont: profile.monoFont,
  sansFontSize: profile.sansFontSize,
  monoFontSize: profile.monoFontSize,
  rounding: profile.rounding,
});

export const serialize = (appearance: Appearance): PersistedAppearance => {
  const normalized = normalize(appearance);
  return {
    themeMode: normalized.themeMode,
    reduceMotion: normalized.reduceMotion,
    useCursorPointers: normalized.useCursorPointers,
    themes: {
      light: serializeThemeProfile(normalized.themes.light),
      dark: serializeThemeProfile(normalized.themes.dark),
    },
  };
};

const hasArrayColorTokens = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const themes = record["themes"];
  if (typeof themes !== "object" || themes === null) {
    return false;
  }

  for (const profile of Object.values(themes)) {
    if (typeof profile !== "object" || profile === null) {
      continue;
    }

    const tokens = (profile as Record<string, unknown>)["tokens"];
    if (typeof tokens !== "object" || tokens === null) {
      continue;
    }

    if (Object.values(tokens).some((token) => Array.isArray(token))) {
      return true;
    }
  }

  return false;
};

export const fileName = "appearance.json";

export const shouldRewritePersisted = (
  value: unknown,
  _normalized: Appearance,
  _serialized: unknown,
): boolean => hasArrayColorTokens(value);
