import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { nativeTheme } from "electron";
import { DEFAULT_SKILLSETS, DOCUMENTS_PATH } from "~/shared/constants";
import {
  WindowIds,
  type AccountWithScript,
  type MainLogEntry,
  type Settings,
} from "~/shared/types";
import { ASSET_PATH, PLATFORM } from "../constants";
import { gameServers } from "../services/game-servers";
import { logFromRenderer, setLoggerDebug } from "../services/logger";
import { scriptService } from "../services/scripts";
import { windowsService, type SubwindowConfig } from "../services/windows";
import { getSettings } from "../settings";
import { TipcResult } from "./result";

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
    getPlatform: tipc.procedure.action(async () => PLATFORM),

    getAssetPath: tipc.procedure.action(async () => ASSET_PATH),

    getSkillSets: tipc.procedure.action(async () => {
      await config.load();
      return TipcResult.ok(config.get());
    }),

    launchGame: tipc.procedure
      .input<AccountWithScript>()
      .action(async ({ input }) => {
        windowsService.game(input);
      }),

    launchWindow: tipc.procedure
      .input<WindowIds>()
      .requireSenderWindow()
      .action(async ({ input, context }) => {
        const handle = windowsService.subwindow(context.senderWindowId, input);
        if (!handle) return;
        const config = SUBWINDOW_CONFIGS[input];
        await handle.open(config);
      }),

    loadScript: tipc.procedure
      .requireSenderWindow()
      .input<{ scriptPath?: string }>()
      .action(async ({ context, input: { scriptPath } }) => {
        const isGameWindow = windowsService.isGameWindow(
          context.senderWindowId,
        );
        // TODO: for game, we should prompt as a separate procedure.
        // Game: if no script path, prompt and load. If script path provided, load directly
        if (isGameWindow) {
          if (scriptPath) {
            await scriptService.loadAndRun(context.senderWindow, scriptPath);
            return;
          }

          const result = await scriptService.loadAndRun(context.senderWindow);
          if (result.isErr()) return;
        }

        const path = await scriptService.selectScriptPath(
          context.senderWindow ?? undefined,
        );
        return path ?? "";
      }),

    toggleDevTools: tipc.procedure.action(async ({ context }) => {
      context.senderWindow?.webContents?.toggleDevTools();
    }),

    getSettings: tipc.procedure.action(async () => {
      const settings = getSettings();
      const debug = settings.getBoolean("debug", false);
      setLoggerDebug(debug);
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
      } satisfies Settings;
    }),

    updateSettings: tipc.procedure
      .input<Settings>()
      .action(async ({ input }) => {
        const settings = getSettings();
        settings.set("checkForUpdates", input.checkForUpdates);
        settings.set("debug", input.debug);
        settings.set("fallbackServer", input.fallbackServer);
        settings.set("launchMode", input.launchMode);
        settings.set("theme", input.theme);
        setLoggerDebug(input.debug);
        nativeTheme.themeSource = input.theme;
        await settings.save();
      }),

    getServers: tipc.procedure.action(async () =>
      TipcResult.ok(await gameServers.get()),
    ),

    logEntry: tipc.procedure.input<MainLogEntry>().action(async ({ input }) => {
      logFromRenderer(input);
    }),
  };
}
