import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { DEFAULT_SKILLSETS, DOCUMENTS_PATH } from "~/shared/constants";
import { WindowIds } from "~/shared/types";
import { ASSET_PATH, IS_WINDOWS, IS_MAC, IS_LINUX } from "../constants";
import { logger } from "../services/logger";
import { windowsService, type SubwindowConfig } from "../services/windows";
import { Result } from "better-result";
import { TipcResult } from "./result";

const platform = {
  isMac: IS_MAC,
  isWindows: IS_WINDOWS,
  isLinux: IS_LINUX,
};

const SUBWINDOW_CONFIGS: Record<WindowIds, SubwindowConfig> = {
  [WindowIds.Environment]: {
    height: 520,
    path: "views/environment/index.html",
    width: 783,
  },
  [WindowIds.FastTravels]: {
    height: 527,
    path: "views/fast-travels/index.html",
    width: 670,
  },
  [WindowIds.Follower]: {
    height: 415,
    path: "views/follower/index.html",
    width: 943,
  },
  [WindowIds.Hotkeys]: {
    height: 400,
    path: "views/hotkeys/index.html",
    width: 600,
  },
  [WindowIds.LoaderGrabber]: {
    height: 517,
    path: "views/loader-grabber/index.html",
    width: 800,
  },
  [WindowIds.PacketLogger]: {
    height: 523,
    path: "views/packet-logger/index.html",
    width: 797,
  },
  [WindowIds.PacketSpammer]: {
    height: 403,
    path: "views/packet-spammer/index.html",
    width: 608,
  },
};

const config = new Config<typeof DEFAULT_SKILLSETS>({
  configName: "skill-sets",
  cwd: DOCUMENTS_PATH,
  defaults: DEFAULT_SKILLSETS,
});
export function createAppTipcRouter(tipc: TipcInstance) {
  return {
    getPlatform: tipc.procedure.action(async () => platform),

    getAssetPath: tipc.procedure.action(async () => ASSET_PATH),

    getSkillSets: tipc.procedure.action(async () => {
      const result = await Result.tryPromise({
        try: async () => {
          await config.load();
          return config.get();
        },
        catch: (error) => {
          logger.error("Failed to get skill sets", error);
          return DEFAULT_SKILLSETS;
        },
      });
      return TipcResult.ok(result.unwrap());
    }),

    launchWindow: tipc.procedure
      .input<WindowIds>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const handle = windowsService.subwindow(context.senderWindow.id, input);
        if (!handle) return;
        const config = SUBWINDOW_CONFIGS[input];
        await handle.open(config);
      }),
  };
}
