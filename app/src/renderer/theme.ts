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

const tokenCssNames = new Map<ThemeTokenName, string>(
  THEME_TOKEN_NAMES.map((name) => [
    name,
    `--${name.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`,
  ]),
);

let activeAppearance: Appearance | null = null;

export const rgbToCssValue = (rgb: ThemeRgb): string => rgb.join(", ");

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

  style.setProperty("--font-sans", profile.sansFont);
  style.setProperty("--font-mono", profile.monoFont);
  style.setProperty("--font-sans-size-base", `${profile.sansFontSize}px`);
  style.setProperty("--font-mono-size", `${profile.monoFontSize}px`);
  applyRounding(style, profile.rounding);
};

export const applySettings = (settings: AppSettings): void => {
  applyAppearance(settings.appearance);
};

export const installSettingsSync = (): (() => void) => {
  const bridge = window.ipc?.settings;
  if (!bridge) {
    return () => {};
  }

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

  void bridge
    .get()
    .then(applySettings)
    .catch((error: unknown) => {
      console.error("Failed to load settings:", error);
    });

  const unsubscribeSettings = bridge.onChanged(applySettings);

  return () => {
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
};
