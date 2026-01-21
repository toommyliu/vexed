import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { DEFAULT_SKILLSETS, DOCUMENTS_PATH } from "~/shared/constants";
import { WindowIds } from "~/shared/types";
import { ASSET_PATH } from "../constants";
import { logger } from "../services/logger";
import { windowsService, type SubwindowConfig } from "../services/windows";

const SUBWINDOW_CONFIGS: Record<WindowIds, SubwindowConfig> = {
  [WindowIds.Environment]: {
    height: 520,
    path: "application/environment/index.html",
    width: 783,
  },
  [WindowIds.FastTravels]: {
    height: 527,
    path: "tools/fast-travels/index.html",
    width: 670,
  },
  [WindowIds.Follower]: {
    height: 415,
    path: "tools/follower/index.html",
    width: 943,
  },
  [WindowIds.Hotkeys]: {
    height: 400,
    path: "application/hotkeys/index.html",
    width: 600,
  },
  [WindowIds.LoaderGrabber]: {
    height: 517,
    path: "tools/loader-grabber/index.html",
    width: 800,
  },
  [WindowIds.PacketLogger]: {
    height: 523,
    path: "packets/logger/index.html",
    width: 797,
  },
  [WindowIds.PacketSpammer]: {
    height: 403,
    path: "packets/spammer/index.html",
    width: 608,
  },
};

export function createGameTipcRouter(tipcInstance: TipcInstance) {
  return {
    getAssetPath: tipcInstance.procedure.action(async () => ASSET_PATH),
    getSkillSets: tipcInstance.procedure.action(async () => {
      try {
        const config = new Config<typeof DEFAULT_SKILLSETS>({
          configName: "skill-sets",
          cwd: DOCUMENTS_PATH,
          defaults: DEFAULT_SKILLSETS,
        });
        await config.load();

        return config.get();
      } catch (error) {
        logger.error(
          "main",
          "Failed to get skill sets.",
          error instanceof Error ? error.message : error,
        );

        return DEFAULT_SKILLSETS;
      }
    }),
    launchWindow: tipcInstance.procedure
      .input<WindowIds>()
      .action(async ({ input, context }) => {
        const browserWindow = context.senderWindow;
        if (!browserWindow) return;

        const handle = windowsService.subwindow(browserWindow.id, input);
        if (!handle) return;

        const config = SUBWINDOW_CONFIGS[input];
        await handle.open(config);
      }),
  };
}
