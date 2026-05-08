import type { HotkeysSettings } from "./hotkeys";

export type AppLaunchMode = "game" | "account-manager";

export interface Preferences {
  readonly checkForUpdates: boolean;
  readonly launchMode: AppLaunchMode;
}

export const DEFAULT_PREFERENCES: Preferences = {
  checkForUpdates: true,
  launchMode: "game",
};

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
export type ThemeTokenValues = Record<ThemeTokenName, ThemeRgb>;

export interface ThemeProfile {
  readonly tokens: Partial<Record<ThemeTokenName, ThemeRgb>>;
  readonly sansFont: string;
  readonly monoFont: string;
  readonly sansFontSize: number;
  readonly monoFontSize: number;
  readonly rounding: number;
}

export interface Appearance {
  readonly themeMode: ThemeMode;
  readonly themes: {
    readonly light: ThemeProfile;
    readonly dark: ThemeProfile;
  };
}

export const DEFAULT_SANS_FONT =
  '"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

export const DEFAULT_MONO_FONT =
  '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

export const DEFAULT_SANS_FONT_SIZE = 13;
export const DEFAULT_MONO_FONT_SIZE = 12;

export const DEFAULT_THEME_TOKENS: Record<ThemeVariant, ThemeTokenValues> = {
  light: {
    background: [255, 255, 255],
    foreground: [38, 38, 38],
    card: [255, 255, 255],
    cardForeground: [38, 38, 38],
    popover: [255, 255, 255],
    popoverForeground: [38, 38, 38],
    primary: [38, 38, 38],
    primaryForeground: [250, 250, 250],
    secondary: [245, 245, 245],
    secondaryForeground: [38, 38, 38],
    muted: [245, 245, 245],
    mutedForeground: [92, 92, 92],
    accent: [245, 245, 245],
    accentForeground: [38, 38, 38],
    destructive: [239, 68, 68],
    destructiveForeground: [185, 28, 28],
    success: [16, 185, 129],
    successForeground: [4, 120, 87],
    warning: [245, 158, 11],
    warningForeground: [180, 83, 9],
    info: [59, 130, 246],
    infoForeground: [29, 78, 216],
    border: [235, 235, 235],
    input: [229, 229, 229],
    ring: [163, 163, 163],
  },
  dark: {
    background: [14, 14, 15],
    foreground: [245, 245, 245],
    card: [18, 18, 20],
    cardForeground: [245, 245, 245],
    popover: [22, 22, 24],
    popoverForeground: [245, 245, 245],
    primary: [245, 245, 245],
    primaryForeground: [38, 38, 38],
    secondary: [32, 32, 34],
    secondaryForeground: [245, 245, 245],
    muted: [32, 32, 34],
    mutedForeground: [166, 166, 166],
    accent: [32, 32, 34],
    accentForeground: [245, 245, 245],
    destructive: [248, 113, 113],
    destructiveForeground: [248, 113, 113],
    success: [52, 211, 153],
    successForeground: [52, 211, 153],
    warning: [251, 191, 36],
    warningForeground: [251, 191, 36],
    info: [96, 165, 250],
    infoForeground: [96, 165, 250],
    border: [38, 38, 40],
    input: [46, 46, 49],
    ring: [115, 115, 115],
  },
};

export const DEFAULT_THEME_PROFILE: ThemeProfile = {
  tokens: {},
  sansFont: DEFAULT_SANS_FONT,
  monoFont: DEFAULT_MONO_FONT,
  sansFontSize: DEFAULT_SANS_FONT_SIZE,
  monoFontSize: DEFAULT_MONO_FONT_SIZE,
  rounding: 1,
};

export const DEFAULT_APPEARANCE: Appearance = {
  themeMode: "dark",
  themes: {
    light: DEFAULT_THEME_PROFILE,
    dark: DEFAULT_THEME_PROFILE,
  },
};

export interface AppSettings {
  readonly preferences: Preferences;
  readonly appearance: Appearance;
  readonly hotkeys: HotkeysSettings;
}

export interface PreferencesPatch {
  readonly checkForUpdates?: boolean;
  readonly launchMode?: AppLaunchMode;
}

export interface ThemeProfilePatch {
  readonly tokens?: Partial<Record<ThemeTokenName, ThemeRgb | null>>;
  readonly sansFont?: string;
  readonly monoFont?: string;
  readonly sansFontSize?: number;
  readonly monoFontSize?: number;
  readonly rounding?: number;
}

export interface AppearancePatch {
  readonly themeMode?: ThemeMode;
  readonly themes?: Partial<Record<ThemeVariant, ThemeProfilePatch>>;
}

export type { HotkeyBindings, HotkeysPatch, HotkeysSettings } from "./hotkeys";
export { DEFAULT_HOTKEYS } from "./hotkeys";
