import { join } from "path";
import Config from "@vexed/config";
import type { TipcInstance } from "@vexed/tipc";
import { getRendererHandlers } from "@vexed/tipc";
import { BrowserWindow } from "electron";
import { DEFAULT_SKILLSETS, DOCUMENTS_PATH } from "../../shared/constants";
import { WindowIds } from "../../shared/types";
import { ASSET_PATH, DIST_PATH, IS_PACKAGED } from "../constants";
import type { RendererHandlers } from "../tipc";
import { windowStore } from "../windows";

export function createGameTipcRouter(tipcInstance: TipcInstance) {
  return {
    launchWindow: tipcInstance.procedure
      .input<WindowIds>()
      .action(async ({ input, context }) => {
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        if (!browserWindow || !windowStore.has(browserWindow?.id)) return;

        const storeRef = windowStore.get(browserWindow.id)!;

        let ref: BrowserWindow | null = null;
        let path: string | undefined;
        let width: number;
        let height: number;

        switch (input) {
          case WindowIds.Environment:
            ref = storeRef.app.environment;
            path = join(DIST_PATH, "application", "environment", "index.html");
            width = 783;
            height = 520;
            break;
          case WindowIds.AppLogs:
            ref = storeRef.app.logs;
            path = join(DIST_PATH, "application", "logs", "index.html");
            width = 860;
            height = 560;
            break;
          case WindowIds.Hotkeys:
            ref = storeRef.app.hotkeys;
            path = join(DIST_PATH, "application", "hotkeys", "index.html");
            break;
          case WindowIds.FastTravels:
            ref = storeRef.tools.fastTravels;
            path = join(DIST_PATH, "tools", "fast-travels", "index.html");
            width = 670;
            height = 527;
            break;
          case WindowIds.LoaderGrabber:
            ref = storeRef.tools.loaderGrabber;
            path = join(DIST_PATH, "tools", "loader-grabber", "index.html");
            width = 800;
            height = 517;
            break;
          case WindowIds.Follower:
            ref = storeRef.tools.follower;
            path = join(DIST_PATH, "tools", "follower", "index.html");
            width = 927;
            height = 646;
            break;
          case WindowIds.PacketLogger:
            ref = storeRef.packets.logger;
            path = join(DIST_PATH, "packets", "logger", "index.html");
            width = 797;
            height = 523;
            break;
          case WindowIds.PacketSpammer:
            ref = storeRef.packets.spammer;
            path = join(DIST_PATH, "packets", "spammer", "index.html");
            width = 608;
            height = 403;
            break;
        }

        if (ref && !ref?.isDestroyed()) {
          ref.show();
          ref.focus();
          return;
        }

        const window = new BrowserWindow({
          title: "",
          webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
          },
          useContentSize: true,
          parent: browserWindow,
          width: width!,
          minWidth: width!,
          minHeight: height!,
          height: height!,
          minimizable: false, // https://github.com/electron/electron/issues/26031
          show: false,
        });

        switch (input) {
          case WindowIds.Environment:
            storeRef.app.environment = window;
            break;
          case WindowIds.AppLogs:
            storeRef.app.logs = window;
            break;
          case WindowIds.Hotkeys:
            storeRef.app.hotkeys = window;
            break;
          case WindowIds.FastTravels:
            storeRef.tools.fastTravels = window;
            break;
          case WindowIds.LoaderGrabber:
            storeRef.tools.loaderGrabber = window;
            break;
          case WindowIds.Follower:
            storeRef.tools.follower = window;
            break;
          case WindowIds.PacketLogger:
            storeRef.packets.logger = window;
            break;
          case WindowIds.PacketSpammer:
            storeRef.packets.spammer = window;
            break;
        }

        window.on("ready-to-show", () => {
          window.show();
        });

        // Hide the window instead of closing it
        window.on("close", (ev) => {
          ev.preventDefault();
          window.hide();
        });

        if (input === WindowIds.AppLogs) {
          window.webContents.once("did-finish-load", () => {
            const rendererHandlers = getRendererHandlers<RendererHandlers>(
              window.webContents,
            );
            rendererHandlers.appLogs.init.send({
              entries: storeRef.app.logHistory.slice(),
            });
          });
        }

        await window.loadFile(path!);

        if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });
      }),
    getAssetPath: tipcInstance.procedure.action(async () => ASSET_PATH),
    getSkillSets: tipcInstance.procedure.action(async () => {
      const config = new Config<Record<string, string>>({
        configName: "skill-sets",
        cwd: DOCUMENTS_PATH,
        defaults: DEFAULT_SKILLSETS,
      });
      await config.load();
      return config.get();
    }),
  };
}
