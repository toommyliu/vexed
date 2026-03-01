import fs from "fs";
import { join } from "path";
import Config from "@vexed/config";
import { normalizeSettings } from "~/shared/settings/normalize";
import type { Settings, NormalizationIssue } from "~/shared/settings/types";
import { DOCUMENTS_PATH } from "./constants";
import { DEFAULT_SETTINGS } from "./defaults";
import { createLogger } from "./services/logger";

const rename = fs.promises.rename;

let settings: Config<Settings>;
const logger = createLogger("app:settings");
const SETTINGS_CONFIG_NAME = "settings";

function formatIssues(issues: NormalizationIssue[]): string {
  return issues.map((issue) => `${issue.path}: ${issue.reason}`).join("; ");
}

async function createSettingsConfig(): Promise<Config<Settings>> {
  const createResult = await Config.create<Settings>({
    configName: SETTINGS_CONFIG_NAME,
    cwd: DOCUMENTS_PATH,
    defaults: DEFAULT_SETTINGS,
  });

  if (createResult.isOk()) return createResult.value;

  const error = createResult.error as { _tag?: string; message?: string };
  if (error._tag !== "FsJsonParseError") throw createResult.error;

  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const sourcePath = join(DOCUMENTS_PATH, `${SETTINGS_CONFIG_NAME}.json`);
  const backupPath = join(
    DOCUMENTS_PATH,
    `${SETTINGS_CONFIG_NAME}.corrupt-${timestamp}.json`,
  );

  await rename(sourcePath, backupPath);
  logger.warn(
    `Recovered malformed settings file by moving it to ${backupPath}.`,
  );

  const recoveredResult = await Config.create<Settings>({
    configName: SETTINGS_CONFIG_NAME,
    cwd: DOCUMENTS_PATH,
    defaults: DEFAULT_SETTINGS,
  });
  if (recoveredResult.isErr()) throw recoveredResult.error;
  return recoveredResult.value;
}

export async function initSettings(): Promise<Config<Settings>> {
  if (settings) return settings;

  const result = await createSettingsConfig();
  const normalized = normalizeSettings(result.get(), DEFAULT_SETTINGS);
  if (normalized.issues.length > 0) {
    logger.warn(
      `Sanitized malformed settings values during startup: ${formatIssues(normalized.issues)}`,
    );
  }

  if (normalized.changed) {
    result.set(normalized.value);
    const saveResult = await result.save();
    if (saveResult.isErr()) {
      logger.warn("Failed to persist normalized settings", saveResult.error);
    }
  }

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
