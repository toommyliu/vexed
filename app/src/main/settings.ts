import Config from "@vexed/config";
import { DOCUMENTS_PATH } from "./constants";
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
  const result = await Config.create<Settings>({
    configName: "settings",
    cwd: DOCUMENTS_PATH,
    defaults: DEFAULT_SETTINGS,
  });
  // eslint-disable-next-line require-atomic-updates
  settings = result.unwrap();
  return settings;
}

export function getSettings(): Config<Settings> {
  if (!settings) {
    throw new Error("Settings not initialized");
  }

  return settings;
}
