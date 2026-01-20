import Config from "@vexed/config";
import { DOCUMENTS_PATH } from "~/shared/constants";
import type { Settings } from "~/shared/types";

const DEFAULT_SETTINGS: Settings = {
  checkForUpdates: false,
  debug: false,
  fallbackServer: "",
  launchMode: "game",
  theme: "dark",
} as const;

let settings: Config<Settings>;

export async function initSettings(): Promise<Config<Settings>> {
  if (settings) return settings;

  // eslint-disable-next-line require-atomic-updates
  settings = await Config.create<Settings>({
    configName: "settings",
    cwd: DOCUMENTS_PATH,
    defaults: DEFAULT_SETTINGS,
  });
  return settings;
}

export function getSettings(): Config<Settings> {
  if (!settings) {
    throw new Error("Settings not initialized");
  }

  return settings;
}
