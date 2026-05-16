import {
  DEFAULT_THEME_TOKENS,
  THEME_TOKEN_NAMES,
  type Appearance,
  type MotionMode,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeTokenValues,
  type ThemeVariant,
} from "./settings";

export const APPEARANCE_SNAPSHOT_ARGUMENT = "--appearance-snapshot";

const radiusBaseRem = {
  "--radius": 0.625,
  "--radius-xs": 0.25,
  "--radius-sm": 0.375,
  "--radius-md": 0.5,
  "--radius-lg": 0.5,
  "--radius-xl": 0.75,
} as const;

const textSizeRatios = {
  "--text-2xs": 10 / 13,
  "--text-xs": 11 / 13,
  "--text-sm": 12 / 13,
  "--text-base": 1,
  "--text-md": 14 / 13,
  "--text-lg": 15 / 13,
  "--text-xl": 16 / 13,
  "--text-2xl": 18 / 13,
  "--text-3xl": 20 / 13,
  "--text-4xl": 24 / 13,
  "--text-5xl": 28 / 13,
} as const;

type RadiusTokenName = keyof typeof radiusBaseRem;
export type TextSizeTokenName = keyof typeof textSizeRatios;

const tokenCssNames = new Map<ThemeTokenName, string>(
  THEME_TOKEN_NAMES.map((name) => [
    name,
    `--${name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`,
  ]),
);

export interface AppearanceSnapshot {
  readonly variant: ThemeVariant;
  readonly tokens: ThemeTokenValues;
  readonly sansFont: string;
  readonly monoFont: string;
  readonly sansFontSize: number;
  readonly monoFontSize: number;
  readonly rounding: number;
  readonly reduceMotion: MotionMode;
  readonly useCursorPointers: boolean;
  readonly backgroundColor: string;
}

export const rgbToCssValue = (rgb: ThemeRgb): string => rgb.join(", ");

const formatPx = (value: number): string => `${Number(value.toFixed(4))}px`;

const toHexPair = (value: number): string =>
  Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");

export const rgbToHex = (rgb: ThemeRgb): string =>
  `#${toHexPair(rgb[0])}${toHexPair(rgb[1])}${toHexPair(rgb[2])}`;

export const getTextSizeTokens = (
  baseSize: number,
): Record<TextSizeTokenName, string> => {
  const tokens = {} as Record<TextSizeTokenName, string>;

  for (const [name, ratio] of Object.entries(textSizeRatios) as Array<
    [TextSizeTokenName, number]
  >) {
    tokens[name] = formatPx(baseSize * ratio);
  }

  return tokens;
};

export const resolveThemeVariant = (
  appearance: Appearance,
  systemPrefersDark: boolean,
): ThemeVariant => {
  if (appearance.themeMode === "light" || appearance.themeMode === "dark") {
    return appearance.themeMode;
  }

  return systemPrefersDark ? "dark" : "light";
};

export const resolveThemeTokens = (
  appearance: Appearance,
  variant: ThemeVariant,
): ThemeTokenValues => ({
  ...DEFAULT_THEME_TOKENS[variant],
  ...appearance.themes[variant].tokens,
});

export const createAppearanceSnapshot = (
  appearance: Appearance,
  systemPrefersDark: boolean,
): AppearanceSnapshot => {
  const variant = resolveThemeVariant(appearance, systemPrefersDark);
  const profile = appearance.themes[variant];
  const tokens = resolveThemeTokens(appearance, variant);

  return {
    variant,
    tokens,
    sansFont: profile.sansFont,
    monoFont: profile.monoFont,
    sansFontSize: profile.sansFontSize,
    monoFontSize: profile.monoFontSize,
    rounding: profile.rounding,
    reduceMotion: appearance.reduceMotion,
    useCursorPointers: appearance.useCursorPointers,
    backgroundColor: rgbToHex(tokens.background),
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThemeVariant = (value: unknown): value is ThemeVariant =>
  value === "light" || value === "dark";

const isThemeRgb = (value: unknown): value is ThemeRgb => {
  if (!Array.isArray(value) || value.length !== 3) {
    return false;
  }

  return value.every(
    (channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255,
  );
};

const isThemeTokenValues = (value: unknown): value is ThemeTokenValues => {
  if (!isRecord(value)) {
    return false;
  }

  return THEME_TOKEN_NAMES.every((name) => isThemeRgb(value[name]));
};

export const isAppearanceSnapshot = (
  value: unknown,
): value is AppearanceSnapshot => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isThemeVariant(value["variant"]) &&
    isThemeTokenValues(value["tokens"]) &&
    typeof value["sansFont"] === "string" &&
    typeof value["monoFont"] === "string" &&
    typeof value["sansFontSize"] === "number" &&
    Number.isFinite(value["sansFontSize"]) &&
    typeof value["monoFontSize"] === "number" &&
    Number.isFinite(value["monoFontSize"]) &&
    typeof value["rounding"] === "number" &&
    Number.isFinite(value["rounding"]) &&
    (value["reduceMotion"] === "system" ||
      value["reduceMotion"] === "on" ||
      value["reduceMotion"] === "off") &&
    typeof value["useCursorPointers"] === "boolean" &&
    typeof value["backgroundColor"] === "string"
  );
};

export const serializeAppearanceSnapshotArgument = (
  snapshot: AppearanceSnapshot,
): string =>
  `${APPEARANCE_SNAPSHOT_ARGUMENT}=${encodeURIComponent(
    JSON.stringify(snapshot),
  )}`;

export const readAppearanceSnapshotArgument = (
  argv: readonly string[],
): AppearanceSnapshot | null => {
  const prefix = `${APPEARANCE_SNAPSHOT_ARGUMENT}=`;
  const raw = argv.find((arg) => arg.startsWith(prefix));

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(prefix.length)));
    return isAppearanceSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const applyRounding = (
  style: CSSStyleDeclaration,
  multiplier: number,
): void => {
  for (const [name, base] of Object.entries(radiusBaseRem) as Array<
    [RadiusTokenName, number]
  >) {
    style.setProperty(name, `${base * multiplier}rem`);
  }
};

const applyTypography = (
  style: CSSStyleDeclaration,
  snapshot: AppearanceSnapshot,
): void => {
  style.setProperty("--font-sans", snapshot.sansFont);
  style.setProperty("--font-mono", snapshot.monoFont);
  style.setProperty("--font-sans-size-base", formatPx(snapshot.sansFontSize));
  style.setProperty("--font-mono-size", formatPx(snapshot.monoFontSize));

  for (const [name, value] of Object.entries(
    getTextSizeTokens(snapshot.sansFontSize),
  ) as Array<[TextSizeTokenName, string]>) {
    style.setProperty(name, value);
  }
};

export const applyAppearanceSnapshotToDocument = (
  root: HTMLElement,
  snapshot: AppearanceSnapshot,
): void => {
  const style = root.style;

  root.dataset["theme"] = snapshot.variant;
  root.dataset["reduceMotion"] = snapshot.reduceMotion;
  if (snapshot.useCursorPointers) {
    root.dataset["useCursorPointers"] = "true";
  } else {
    delete root.dataset["useCursorPointers"];
  }
  root.classList.toggle("dark", snapshot.variant === "dark");
  style.setProperty("color-scheme", snapshot.variant);
  style.setProperty(
    "--cursor-interactive",
    snapshot.useCursorPointers ? "pointer" : "default",
  );

  for (const name of THEME_TOKEN_NAMES) {
    const cssName = tokenCssNames.get(name);
    if (cssName) {
      style.setProperty(cssName, rgbToCssValue(snapshot.tokens[name]));
    }
  }

  applyTypography(style, snapshot);
  applyRounding(style, snapshot.rounding);
};
