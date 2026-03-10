import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { Result } from "better-result";
import { BrowserWindow, nativeTheme } from "electron";
import { coerceSettings } from "~/shared/settings/normalize";
import type { Settings } from "~/shared/settings/types";
import { WindowIds, type AccountWithScript } from "~/shared/types";
import { getAssetPath, DOCUMENTS_PATH, PLATFORM } from "../constants";
import { DEFAULT_SETTINGS, DEFAULT_SKILLSETS } from "../defaults";
import { gameServers } from "../services/game-servers";
import { createLogger, setLoggerDebug } from "../services/logger";
import { scriptService } from "../services/scripts";
import { windowsService, type SubwindowConfig } from "../services/windows";
import { getSettings } from "../settings";
import { isWindowUsable } from "../util/browser-window";

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
const logger = createLogger("tipc:app");

export function createAppTipcRouter(tipc: TipcInstance) {
  return {
    getPlatform: tipc.procedure.action(async () => PLATFORM),

    getAssetPath: tipc.procedure.action(async () => getAssetPath()),

    getSkillSets: tipc.procedure.action(async () => {
      await config.load();
      return Result.serialize(Result.ok(config.get()));
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
      const coerced = coerceSettings(settings.get(), DEFAULT_SETTINGS);
      setLoggerDebug(coerced.debug);
      nativeTheme.themeSource = coerced.theme;
      return coerced satisfies Settings;
    }),

    updateSettings: tipc.procedure
      .input<Settings>()
      .action(async ({ input }) => {
        const settings = getSettings();
        const current = coerceSettings(settings.get(), DEFAULT_SETTINGS);
        const coercedInput = coerceSettings(input, current);

        settings.set(coercedInput);
        setLoggerDebug(coercedInput.debug);
        nativeTheme.themeSource = coercedInput.theme;
        const saveResult = await settings.save();
        if (saveResult.isErr()) {
          logger.error(
            "Failed to save settings after updateSettings",
            saveResult.error,
          );
          throw saveResult.error;
        }

        const customTheme = coercedInput.customTheme;
        for (const win of BrowserWindow.getAllWindows()) {
          if (isWindowUsable(win))
            win.webContents.send("app.customThemeUpdated", customTheme);
        }
      }),

    getServers: tipc.procedure.action(async () =>
      Result.serialize(Result.ok(await gameServers.get())),
    ),
  };
}
