export type ThemeToken =
  | "accent-foreground"
  | "accent"
  | "background"
  | "border"
  | "card-foreground"
  | "card"
  | "foreground"
  | "muted-foreground"
  | "muted"
  | "popover-foreground"
  | "popover"
  | "primary-foreground"
  | "primary"
  | "ring"
  | "secondary-foreground"
  | "secondary";

export type CustomThemeScheme = Partial<Record<ThemeToken, string>>;

export type CustomTheme = {
  dark?: CustomThemeScheme;
  fontFamily?: string;
  light?: CustomThemeScheme;
  monospaceFontFamily?: string;
  radius?: string;
};

export type Settings = {
  checkForUpdates: boolean;
  customTheme: CustomTheme;
  debug: boolean;
  fallbackServer: string;
  launchMode: "game" | "manager";
  theme: "dark" | "light" | "system";
};

export type LaunchMode = Settings["launchMode"];

export type Theme = Settings["theme"];

export type ThemeScheme = "dark" | "light";
export type ThemeColorToken = ThemeToken;

export type NormalizationIssue = {
  path: string;
  reason: string;
  value?: unknown;
};

export type NormalizationResult<T> = {
  changed: boolean;
  issues: NormalizationIssue[];
  value: T;
};
