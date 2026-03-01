import {
  COLOR_THEME_TOKENS,
  isSafeRadiusValue,
  normalizeHexColor,
  sanitizeFontFamily,
} from "~/shared/settings/normalize";
import type {
  CustomTheme,
  ThemeColorToken,
  ThemeScheme,
  ThemeToken,
} from "~/shared/settings/types";

const ALL_THEME_TOKENS: ThemeToken[] = [...COLOR_THEME_TOKENS];

const SCHEME_DEFAULT_HEX: Record<
  ThemeScheme,
  Record<ThemeColorToken, string>
> = {
  dark: {
    accent: "#282a36",
    "accent-foreground": "#8894f2",
    background: "#0f0f10",
    border: "#262628",
    card: "#151516",
    "card-foreground": "#eeeff1",
    foreground: "#eeeff1",
    muted: "#1e1e20",
    "muted-foreground": "#636366",
    popover: "#19191b",
    "popover-foreground": "#eeeff1",
    primary: "#6a76de",
    "primary-foreground": "#eeeff1",
    ring: "#6a76de",
    secondary: "#1e1e20",
    "secondary-foreground": "#aeaeb2",
  },
  light: {
    accent: "#e8eaff",
    "accent-foreground": "#4c56af",
    background: "#fafafc",
    border: "#e5e5ea",
    card: "#ffffff",
    "card-foreground": "#1c1c1e",
    foreground: "#1c1c1e",
    muted: "#f2f2f7",
    "muted-foreground": "#8e8e93",
    popover: "#ffffff",
    "popover-foreground": "#1c1c1e",
    primary: "#5e6ad2",
    "primary-foreground": "#ffffff",
    ring: "#5e6ad2",
    secondary: "#f2f2f7",
    "secondary-foreground": "#3c3c43",
  },
};

export function getColorScheme(): ThemeScheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function hexToRgbTriplet(hex: string): string | null {
  const normalizedHex = normalizeHexColor(hex);
  if (!normalizedHex) return null;
  const cleanedHex = normalizedHex.slice(1);
  const red = Number.parseInt(cleanedHex.slice(0, 2), 16);
  const green = Number.parseInt(cleanedHex.slice(2, 4), 16);
  const blue = Number.parseInt(cleanedHex.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

export function rgbTripletToHex(triplet: string): string | null {
  const parts = triplet.trim().split(/\s+/u).map(Number);
  if (
    parts.length !== 3 ||
    parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)
  ) {
    return null;
  }

  return `#${parts[0]!.toString(16).padStart(2, "0")}${parts[1]!.toString(16).padStart(2, "0")}${parts[2]!.toString(16).padStart(2, "0")}`;
}

export function getComputedTokenHex(token: ThemeColorToken): string | null {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${token}`)
    .trim();
  if (!raw) return null;
  return rgbTripletToHex(raw);
}

/**
 * Resolves which color should be displayed in the onboarding color swatch:
 * explicit override -> computed current token (if editing active scheme) ->
 * canonical scheme default.
 */
export function resolveDisplayTokenHex(
  customTheme: CustomTheme,
  editScheme: ThemeScheme,
  token: ThemeColorToken,
  currentScheme: ThemeScheme = getColorScheme(),
): string {
  const schemeOverrides = customTheme[editScheme] ?? {};
  const override = schemeOverrides[token];
  if (typeof override === "string") {
    const normalized = normalizeHexColor(override);
    if (normalized) return normalized;
  }

  if (editScheme === currentScheme) {
    const computed = getComputedTokenHex(token);
    if (computed) return computed;
  }

  return SCHEME_DEFAULT_HEX[editScheme][token];
}

export function applyCustomTheme(
  customTheme: CustomTheme,
  scheme: ThemeScheme,
): void {
  const overrides = customTheme[scheme] ?? {};

  for (const token of COLOR_THEME_TOKENS) {
    const value = overrides[token];
    if (typeof value !== "string") {
      document.documentElement.style.removeProperty(`--${token}`);
      continue;
    }

    const rgbTriplet = hexToRgbTriplet(value);
    if (!rgbTriplet) {
      document.documentElement.style.removeProperty(`--${token}`);
      continue;
    }

    document.documentElement.style.setProperty(`--${token}`, rgbTriplet);
  }

  const radius = customTheme.radius;
  if (typeof radius === "string" && isSafeRadiusValue(radius)) {
    document.documentElement.style.setProperty("--radius", radius.trim());
  } else {
    document.documentElement.style.removeProperty("--radius");
  }

  const fontFamily = sanitizeFontFamily(customTheme.fontFamily);
  if (fontFamily) {
    document.documentElement.style.setProperty("--font-family", fontFamily);
  } else {
    document.documentElement.style.removeProperty("--font-family");
  }

  const monospaceFontFamily = sanitizeFontFamily(
    customTheme.monospaceFontFamily,
  );
  if (monospaceFontFamily) {
    document.documentElement.style.setProperty(
      "--font-mono",
      monospaceFontFamily,
    );
  } else {
    document.documentElement.style.removeProperty("--font-mono");
  }
}

export function clearCustomTheme(): void {
  for (const token of ALL_THEME_TOKENS)
    document.documentElement.style.removeProperty(`--${token}`);
  document.documentElement.style.removeProperty("--radius");
  document.documentElement.style.removeProperty("--font-family");
  document.documentElement.style.removeProperty("--font-mono");
}
