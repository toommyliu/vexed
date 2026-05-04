import {
  THEME_TOKEN_NAMES,
  type Appearance,
  type AppSettings,
  type ThemeRgb,
  type ThemeTokenName,
  type ThemeVariant,
} from "../shared/settings";

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

type TextSizeTokenName = keyof typeof textSizeRatios;

const tokenCssNames = new Map<ThemeTokenName, string>(
  THEME_TOKEN_NAMES.map((name) => [
    name,
    `--${name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`,
  ]),
);

let activeAppearance: Appearance | null = null;

export interface RendererSettingsSync {
  readonly ready: Promise<AppSettings | null>;
  readonly dispose: () => void;
}

export const rgbToCssValue = (rgb: ThemeRgb): string => rgb.join(", ");

const formatPx = (value: number): string => `${Number(value.toFixed(4))}px`;

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

export const resolveActiveThemeVariant = (
  appearance: Appearance,
): ThemeVariant => {
  if (appearance.themeMode === "light" || appearance.themeMode === "dark") {
    return appearance.themeMode;
  }

  return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const clearTokenOverrides = (style: CSSStyleDeclaration): void => {
  for (const cssName of tokenCssNames.values()) {
    style.removeProperty(cssName);
  }
};

const applyRounding = (
  style: CSSStyleDeclaration,
  multiplier: number,
): void => {
  for (const [name, base] of Object.entries(radiusBaseRem)) {
    style.setProperty(name, `${base * multiplier}rem`);
  }
};

const applyTypography = (
  style: CSSStyleDeclaration,
  profile: Appearance["themes"][ThemeVariant],
): void => {
  style.setProperty("--font-sans", profile.sansFont);
  style.setProperty("--font-mono", profile.monoFont);
  style.setProperty("--font-sans-size-base", formatPx(profile.sansFontSize));
  style.setProperty("--font-mono-size", formatPx(profile.monoFontSize));

  for (const [name, value] of Object.entries(
    getTextSizeTokens(profile.sansFontSize),
  ) as Array<[TextSizeTokenName, string]>) {
    style.setProperty(name, value);
  }
};

export const applyAppearance = (appearance: Appearance): void => {
  activeAppearance = appearance;

  const root = document.documentElement;
  const style = root.style;
  const variant = resolveActiveThemeVariant(appearance);
  const profile = appearance.themes[variant];

  root.dataset["theme"] = variant;
  root.classList.toggle("dark", variant === "dark");

  clearTokenOverrides(style);

  for (const [name, value] of Object.entries(profile.tokens)) {
    const cssName = tokenCssNames.get(name as ThemeTokenName);
    if (cssName && value) {
      style.setProperty(cssName, rgbToCssValue(value));
    }
  }

  applyTypography(style, profile);
  applyRounding(style, profile.rounding);
};

export const applySettings = (settings: AppSettings): void => {
  applyAppearance(settings.appearance);
};

export const installSettingsSync = (): RendererSettingsSync => {
  const bridge = window.ipc?.settings;
  if (!bridge) {
    return {
      ready: Promise.resolve(null),
      dispose: () => {},
    };
  }

  let disposed = false;
  let initialSettled = false;
  let changedDuringInitialLoad = false;
  let latestSettings: AppSettings | null = null;
  const media = globalThis.matchMedia?.("(prefers-color-scheme: dark)") ?? null;
  const mediaListener = () => {
    if (activeAppearance?.themeMode === "system") {
      applyAppearance(activeAppearance);
    }
  };

  if (media) {
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", mediaListener);
    } else {
      media.addListener(mediaListener);
    }
  }

  const unsubscribeSettings = bridge.onChanged((settings) => {
    latestSettings = settings;
    if (!initialSettled) {
      changedDuringInitialLoad = true;
    }
    applySettings(settings);
  });

  const ready = bridge
    .get()
    .then((settings) => {
      latestSettings = changedDuringInitialLoad ? latestSettings : settings;

      if (!changedDuringInitialLoad && !disposed) {
        applySettings(settings);
      }

      initialSettled = true;
      return latestSettings;
    })
    .catch((error: unknown) => {
      initialSettled = true;
      console.error("Failed to load settings:", error);
      return null;
    });

  const dispose = () => {
    if (disposed) {
      return;
    }

    disposed = true;
    unsubscribeSettings();

    if (!media) {
      return;
    }

    if (typeof media.removeEventListener === "function") {
      media.removeEventListener("change", mediaListener);
    } else {
      media.removeListener(mediaListener);
    }
  };

  return { ready, dispose };
};
