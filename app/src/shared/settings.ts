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

export interface ThemeProfile {
  readonly tokens: Partial<Record<ThemeTokenName, ThemeRgb>>;
  readonly sansFont: string;
  readonly monoFont: string;
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

export const DEFAULT_THEME_PROFILE: ThemeProfile = {
  tokens: {},
  sansFont: DEFAULT_SANS_FONT,
  monoFont: DEFAULT_MONO_FONT,
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
}

export interface PreferencesPatch {
  readonly checkForUpdates?: boolean;
  readonly launchMode?: AppLaunchMode;
}

export interface ThemeProfilePatch {
  readonly tokens?: Partial<Record<ThemeTokenName, ThemeRgb | null>>;
  readonly sansFont?: string;
  readonly monoFont?: string;
  readonly rounding?: number;
}

export interface AppearancePatch {
  readonly themeMode?: ThemeMode;
  readonly themes?: Partial<Record<ThemeVariant, ThemeProfilePatch>>;
}
