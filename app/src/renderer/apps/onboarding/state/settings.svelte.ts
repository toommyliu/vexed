import type { LaunchMode, Settings, Theme } from "~/shared/settings/types";

export const settings = $state<Settings>({
  checkForUpdates: false,
  customTheme: {},
  debug: false,
  fallbackServer: "",
  launchMode: "" as LaunchMode,
  theme: "" as Theme,
});
