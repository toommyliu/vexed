import type { ServerData } from "@vexed/game";
import type { TipcInstance } from "@vexed/tipc";
import { nativeTheme } from "electron";
import fetch from "node-fetch";
import type { Settings } from "~/shared/types";
import { logger, setLoggerDebugEnabled } from "../services/logger";
import { getSettings } from "../settings";

const SERVERS_API_URL = "https://game.aq.com/game/api/data/servers";

export type OnboardingSettings = Pick<
  Settings,
  "checkForUpdates" | "debug" | "fallbackServer" | "launchMode" | "theme"
>;

export function createOnboardingTipcRouter(tipcInstance: TipcInstance) {
  return {
    getSettings: tipcInstance.procedure.action(async () => {
      const settings = getSettings();
      const debug = settings.getBoolean("debug", false);
      setLoggerDebugEnabled(debug);
      return {
        checkForUpdates: settings.getBoolean("checkForUpdates", false),
        debug,
        fallbackServer: settings.getString("fallbackServer", ""),
        launchMode: settings.getString("launchMode", "game") as
          | "game"
          | "manager",
        theme: settings.getString("theme", "dark") as
          | "dark"
          | "light"
          | "system",
      } satisfies OnboardingSettings;
    }),
    updateSettings: tipcInstance.procedure
      .input<OnboardingSettings>()
      .action(async ({ input }) => {
        const settings = getSettings();
        settings.set("checkForUpdates", input.checkForUpdates);
        settings.set("debug", input.debug);
        settings.set("fallbackServer", input.fallbackServer);
        settings.set("launchMode", input.launchMode);
        settings.set("theme", input.theme);

        setLoggerDebugEnabled(input.debug);
        nativeTheme.themeSource = input.theme;

        await settings.save();
      }),
    getServers: tipcInstance.procedure.action(async () => {
      try {
        const resp = await fetch(SERVERS_API_URL);
        if (!resp.ok) return [];

        const data = await resp.json();

        if (!Array.isArray(data)) return [];
        return data as ServerData[];
      } catch (error) {
        logger.error(
          "main",
          "Failed to fetch servers",
          error instanceof Error ? error.message : error,
        );
        return [];
      }
    }),
  };
}
