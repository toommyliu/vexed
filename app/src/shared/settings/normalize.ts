import deepEqual from 'fast-deep-equal';
import type {
  CustomTheme,
  CustomThemeScheme,
  NormalizationIssue,
  NormalizationResult,
  Settings,
  ThemeColorToken,
  ThemeScheme,
  ThemeToken,
} from "./types";

// TODO: we may simply do typeof checks at a high level and not worry about unknown keys

export const COLOR_THEME_TOKENS: ThemeColorToken[] = [
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

const THEME_SCHEMES: ThemeScheme[] = ["dark", "light"];
const SETTINGS_KEYS = new Set<keyof Settings>([
  "checkForUpdates",
  "customTheme",
  "debug",
  "fallbackServer",
  "launchMode",
  "theme",
]);
const THEME_TOKEN_SET = new Set<ThemeToken>(COLOR_THEME_TOKENS);
const COLOR_TOKEN_SET = new Set<ThemeColorToken>(COLOR_THEME_TOKENS);
const LAUNCH_MODE_SET = new Set<Settings["launchMode"]>(["game", "manager"]);
const THEME_MODE_SET = new Set<Settings["theme"]>(["dark", "light", "system"]);
const HEX_COLOR_REGEX = /^#[\da-f]{6}$/iu;
const RADIUS_REGEX =
  /^(?:0|(?:\d+|\d*\.\d+)(?:px|rem|em|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc))$/iu;
const UNSAFE_FONT_FAMILY_REGEX = /[;{}]/u;
const FONT_FAMILY_MAX_LENGTH = 200;
const FALLBACK_SERVER_MAX_LENGTH = 120;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cloneThemeScheme(
  scheme: CustomThemeScheme | undefined,
): CustomThemeScheme {
  if (!scheme) return {};
  const cloned: CustomThemeScheme = {};
  for (const token of Object.keys(scheme)) {
    const typedToken = token as ThemeToken;
    const value = scheme[typedToken];
    if (typeof value === "string") cloned[typedToken] = value;
  }

  return cloned;
}

function cloneCustomTheme(theme: CustomTheme): CustomTheme {
  const cloned: CustomTheme = {};
  if (theme.dark) cloned.dark = cloneThemeScheme(theme.dark);
  if (theme.light) cloned.light = cloneThemeScheme(theme.light);
  if (typeof theme.fontFamily === "string")
    cloned.fontFamily = theme.fontFamily;
  if (typeof theme.monospaceFontFamily === "string")
    cloned.monospaceFontFamily = theme.monospaceFontFamily;
  if (typeof theme.radius === "string")
    cloned.radius = theme.radius;
  return cloned;
}

function cloneSettings(settings: Settings): Settings {
  return {
    checkForUpdates: settings.checkForUpdates,
    customTheme: cloneCustomTheme(settings.customTheme),
    debug: settings.debug,
    fallbackServer: settings.fallbackServer,
    launchMode: settings.launchMode,
    theme: settings.theme,
  };
}

function addIssue(
  issues: NormalizationIssue[],
  path: string,
  reason: string,
  value?: unknown,
): void {
  issues.push({ path, reason, value });
}

export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  return isValidHexColor(trimmed) ? trimmed.toLowerCase() : null;
}

export function isSafeRadiusValue(value: string): boolean {
  return RADIUS_REGEX.test(value.trim());
}

/**
 * Returns:
 * - `null` if invalid
 * - `""` if explicitly empty/cleared
 * - a trimmed font-family string when valid
 */
export function sanitizeFontFamily(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length > FONT_FAMILY_MAX_LENGTH) return null;
  if (hasControlCharacters(trimmed)) return null;
  if (UNSAFE_FONT_FAMILY_REGEX.test(trimmed)) return null;
  return trimmed;
}

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (
      codePoint <= 0x1f /* null, tab, newline, etc  */ ||
      codePoint === 0x7f /* DEL */
    )
      return true;
  }

  return false;
}

function isThemeToken(value: string): value is ThemeToken {
  return THEME_TOKEN_SET.has(value as ThemeToken);
}

function isColorToken(value: ThemeToken): value is ThemeColorToken {
  return COLOR_TOKEN_SET.has(value as ThemeColorToken);
}

function isDeepEqual(left: unknown, right: unknown): boolean {
  return deepEqual(left,right);
  // if (Object.is(left, right)) return true;
  // if (Array.isArray(left) || Array.isArray(right)) {
  //   if (!Array.isArray(left) || !Array.isArray(right)) return false;
  //   if (left.length !== right.length) return false;
  //   for (const [index, leftValue] of left.entries()) {
  //     if (!isDeepEqual(leftValue, right[index])) return false;
  //   }

  //   return true;
  // }

  // if (!isRecord(left) || !isRecord(right)) return false;

  // const leftKeys = Object.keys(left);
  // const rightKeys = Object.keys(right);
  // if (leftKeys.length !== rightKeys.length) return false;

  // for (const key of leftKeys) {
  //   if (!(key in right)) return false;
  //   if (!isDeepEqual(left[key], right[key])) return false;
  // }

  // return true;
}

function normalizeCustomThemeInternal(
  raw: unknown,
  fallbackCustomTheme: CustomTheme,
  pathPrefix = "customTheme",
): NormalizationResult<CustomTheme> {
  const issues: NormalizationIssue[] = [];

  if (!isRecord(raw)) {
    addIssue(
      issues,
      pathPrefix,
      "Expected an object for customTheme; using fallback custom theme.",
      raw,
    );
    const fallbackValue = cloneCustomTheme(fallbackCustomTheme);
    return { changed: true, issues, value: fallbackValue };
  }

  const value: CustomTheme = {};

  for (const key of Object.keys(raw)) {
    if (
      key === "dark" ||
      key === "light" ||
      key === "fontFamily" ||
      key === "monospaceFontFamily" ||
      key === "radius"
    )
      continue;
    addIssue(
      issues,
      `${pathPrefix}.${key}`,
      "Unknown customTheme key was discarded.",
      raw[key],
    );
  }

  for (const scheme of THEME_SCHEMES) {
    const rawScheme = raw[scheme];
    const fallbackScheme = fallbackCustomTheme[scheme] ?? {};

    if (rawScheme === undefined) continue;

    if (!isRecord(rawScheme)) {
      addIssue(
        issues,
        `${pathPrefix}.${scheme}`,
        "Expected a token object for theme scheme; using fallback scheme.",
        rawScheme,
      );
      if (Object.keys(fallbackScheme).length > 0) {
        value[scheme] = cloneThemeScheme(fallbackScheme);
      }

      continue;
    }

    const normalizedScheme: CustomThemeScheme = {};
    for (const token of Object.keys(rawScheme)) {
      if (!isThemeToken(token)) {
        addIssue(
          issues,
          `${pathPrefix}.${scheme}.${token}`,
          "Unknown token was discarded.",
          rawScheme[token],
        );
        continue;
      }

      const rawTokenValue = rawScheme[token];
      const fallbackTokenValue = fallbackScheme[token];

      if (typeof rawTokenValue === "string") {
        const normalizedHex = normalizeHexColor(rawTokenValue);
        if (normalizedHex) {
          normalizedScheme[token] = normalizedHex;
          continue;
        }
      }

      addIssue(
        issues,
        `${pathPrefix}.${scheme}.${token}`,
        "Invalid color value; using fallback or removing override.",
        rawTokenValue,
      );
      if (typeof fallbackTokenValue === "string") {
        const normalizedFallbackHex = normalizeHexColor(fallbackTokenValue);
        if (normalizedFallbackHex) {
          normalizedScheme[token] = normalizedFallbackHex;
        }
      }
    }

    // Keep an explicitly provided empty scheme so user-clears are persisted.
    if (
      Object.keys(normalizedScheme).length > 0 ||
      Object.keys(rawScheme).length === 0
    ) {
      value[scheme] = normalizedScheme;
    }
  }

  if ("fontFamily" in raw) {
    const sanitizedFontFamily = sanitizeFontFamily(raw["fontFamily"]);
    if (sanitizedFontFamily === null) {
      addIssue(
        issues,
        `${pathPrefix}.fontFamily`,
        "Invalid fontFamily value; using fallback or removing override.",
        raw["fontFamily"],
      );
      const fallbackFontFamily = sanitizeFontFamily(
        fallbackCustomTheme.fontFamily,
      );
      if (fallbackFontFamily) value.fontFamily = fallbackFontFamily;
    } else if (sanitizedFontFamily) {
      value.fontFamily = sanitizedFontFamily;
    }
  }

  if ("monospaceFontFamily" in raw) {
    const sanitizedMonospaceFontFamily = sanitizeFontFamily(
      raw["monospaceFontFamily"],
    );
    if (sanitizedMonospaceFontFamily === null) {
      addIssue(
        issues,
        `${pathPrefix}.monospaceFontFamily`,
        "Invalid monospaceFontFamily value; using fallback or removing override.",
        raw["monospaceFontFamily"],
      );
      const fallbackMonospaceFontFamily = sanitizeFontFamily(
        fallbackCustomTheme.monospaceFontFamily,
      );
      if (fallbackMonospaceFontFamily)
        value.monospaceFontFamily = fallbackMonospaceFontFamily;
    } else if (sanitizedMonospaceFontFamily) {
      value.monospaceFontFamily = sanitizedMonospaceFontFamily;
    }
  }

  // Handle top-level radius. Also migrate old per-scheme radius values from
  // before radius became a global setting.
  const rawRadius = "radius" in raw
    ? raw["radius"]
    : (raw["dark"] as Record<string, unknown> | undefined)?.["radius"] ??
      (raw["light"] as Record<string, unknown> | undefined)?.["radius"];
  if (rawRadius !== undefined) {
    if (typeof rawRadius === "string") {
      const trimmed = rawRadius.trim();
      if (isSafeRadiusValue(trimmed)) {
        value.radius = trimmed;
      } else {
        addIssue(
          issues,
          `${pathPrefix}.radius`,
          "Invalid radius value; using fallback or removing override.",
          rawRadius,
        );
        if (
          typeof fallbackCustomTheme.radius === "string" &&
          isSafeRadiusValue(fallbackCustomTheme.radius)
        ) {
          value.radius = fallbackCustomTheme.radius.trim();
        }
      }
    } else {
      addIssue(
        issues,
        `${pathPrefix}.radius`,
        "Invalid radius value; using fallback or removing override.",
        rawRadius,
      );
      if (
        typeof fallbackCustomTheme.radius === "string" &&
        isSafeRadiusValue(fallbackCustomTheme.radius)
      ) {
        value.radius = fallbackCustomTheme.radius.trim();
      }
    }
  }

  return {
    changed: !isDeepEqual(raw, value),
    issues,
    value,
  };
}

export function normalizeCustomTheme(
  raw: unknown,
  fallbackCustomTheme: CustomTheme,
): CustomTheme {
  return normalizeCustomThemeInternal(raw, fallbackCustomTheme).value;
}

function normalizeBoolean(
  raw: unknown,
  fallbackValue: boolean,
  issues: NormalizationIssue[],
  path: string,
): boolean {
  if (raw === undefined) return fallbackValue;
  if (typeof raw === "boolean") return raw;
  addIssue(issues, path, "Expected boolean; using fallback value.", raw);
  return fallbackValue;
}

function normalizeFallbackServer(
  raw: unknown,
  fallbackValue: string,
  issues: NormalizationIssue[],
  path: string,
): string {
  if (raw === undefined) return fallbackValue;
  if (typeof raw !== "string") {
    addIssue(issues, path, "Expected string; using fallback value.", raw);
    return fallbackValue;
  }

  const trimmed = raw.trim();
  if (trimmed.length > FALLBACK_SERVER_MAX_LENGTH) {
    addIssue(
      issues,
      path,
      "String exceeded max length; using fallback value.",
      raw,
    );
    return fallbackValue;
  }

  return trimmed;
}

function normalizeLaunchMode(
  raw: unknown,
  fallbackValue: Settings["launchMode"],
  issues: NormalizationIssue[],
): Settings["launchMode"] {
  if (raw === undefined) return fallbackValue;
  if (
    typeof raw === "string" &&
    LAUNCH_MODE_SET.has(raw as Settings["launchMode"])
  ) {
    return raw as Settings["launchMode"];
  }

  addIssue(
    issues,
    "launchMode",
    "Expected launchMode to be 'game' or 'manager'; using fallback value.",
    raw,
  );
  return fallbackValue;
}

function normalizeThemeMode(
  raw: unknown,
  fallbackValue: Settings["theme"],
  issues: NormalizationIssue[],
): Settings["theme"] {
  if (raw === undefined) return fallbackValue;
  if (typeof raw === "string" && THEME_MODE_SET.has(raw as Settings["theme"]))
    return raw as Settings["theme"];
  addIssue(
    issues,
    "theme",
    "Expected theme to be 'dark', 'light', or 'system'; using fallback value.",
    raw,
  );
  return fallbackValue;
}

export function normalizeSettings(
  raw: unknown,
  fallback: Settings = DEFAULT_SETTINGS,
): NormalizationResult<Settings> {
  const issues: NormalizationIssue[] = [];
  const fallbackSettings = cloneSettings(fallback);

  if (!isRecord(raw)) {
    addIssue(
      issues,
      "settings",
      "Expected settings object; using fallback settings.",
      raw,
    );
    return { changed: true, issues, value: fallbackSettings };
  }

  for (const key of Object.keys(raw)) {
    if (SETTINGS_KEYS.has(key as keyof Settings)) continue;
    addIssue(issues, key, "Unknown settings key was discarded.", raw[key]);
  }

  const customThemeResult =
    "customTheme" in raw
      ? normalizeCustomThemeInternal(
          raw["customTheme"],
          fallbackSettings.customTheme,
        )
      : {
          changed: false,
          issues: [] as NormalizationIssue[],
          value: cloneCustomTheme(fallbackSettings.customTheme),
        };

  issues.push(...customThemeResult.issues);

  const value: Settings = {
    checkForUpdates: normalizeBoolean(
      raw["checkForUpdates"],
      fallbackSettings.checkForUpdates,
      issues,
      "checkForUpdates",
    ),
    customTheme: customThemeResult.value,
    debug: normalizeBoolean(
      raw["debug"],
      fallbackSettings.debug,
      issues,
      "debug",
    ),
    fallbackServer: normalizeFallbackServer(
      raw["fallbackServer"],
      fallbackSettings.fallbackServer,
      issues,
      "fallbackServer",
    ),
    launchMode: normalizeLaunchMode(
      raw["launchMode"],
      fallbackSettings.launchMode,
      issues,
    ),
    theme: normalizeThemeMode(raw["theme"], fallbackSettings.theme, issues),
  };

  return {
    changed: !isDeepEqual(raw, value),
    issues,
    value,
  };
}

export function getCustomThemeScheme(
  customTheme: CustomTheme,
  scheme: ThemeScheme,
): CustomThemeScheme {
  const schemeValue = customTheme[scheme];
  return isRecord(schemeValue) ? schemeValue : {};
}

export function isThemeColorToken(value: string): value is ThemeColorToken {
  return COLOR_TOKEN_SET.has(value as ThemeColorToken);
}

export function isTokenColorValueValid(
  token: ThemeToken,
  value: string,
): boolean {
  if (!isColorToken(token)) return false;
  return isValidHexColor(value);
}
