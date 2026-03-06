import Config from "@vexed/config";
import { coerceSettings } from "~/shared/settings/normalize";
import type { Settings } from "~/shared/settings/types";
import { DOCUMENTS_PATH } from "./constants";
import { DEFAULT_SETTINGS } from "./defaults";
import { createLogger } from "./services/logger";

let settings: Config<Settings>;
const logger = createLogger("app:settings");
const SETTINGS_CONFIG_NAME = "settings";

async function createSettingsConfig(): Promise<Config<Settings>> {
  const createResult = await Config.create<Settings>({
    configName: SETTINGS_CONFIG_NAME,
    cwd: DOCUMENTS_PATH,
    defaults: DEFAULT_SETTINGS,
  });

  if (createResult.isOk()) return createResult.value;
  if (createResult.isErr() && createResult.error._tag === 'FsJsonParseError') {
    logger.warn(
      "Failed to parse settings, using defaults in-memory...",
      createResult.error,
    );
    // idk
    return new Config<Settings>({
      configName: SETTINGS_CONFIG_NAME,
      cwd: DOCUMENTS_PATH,
      defaults: DEFAULT_SETTINGS,
    });
  }

  throw createResult.error;
}

export async function initSettings(): Promise<Config<Settings>> {
  if (settings) return settings;
  const result = await createSettingsConfig();
  const coerced = coerceSettings(result.get(), DEFAULT_SETTINGS);
  result.set(coerced);
  // eslint-disable-next-line require-atomic-updates
  settings = result;
  return settings;
}

export function getSettings(): Config<Settings> {
  if (!settings) {
    throw new Error("Settings not initialized");
  }
  
  return settings;
}
