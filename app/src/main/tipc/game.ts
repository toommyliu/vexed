import { join } from "path";
import type { tipc } from "@vexed/tipc";
import { BrowserWindow, app } from "electron";
import { WindowIds } from "../../shared/types";
import { windowStore } from "../windows";

const DIST_PATH = join(__dirname, "../../");

type TipcInstance = ReturnType<typeof tipc.create>;

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
          case WindowIds.Hotkeys:
            ref = storeRef.tools.hotkeys;
            path = join(DIST_PATH, "tools", "hotkeys", "index.html");
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
          parent: browserWindow,
          width: width!,
          minWidth: width!,
          minHeight: height!,
          height: height!,
          minimizable: false, // https://github.com/electron/electron/issues/26031
          show: false,
        });

        switch (input) {
          case WindowIds.FastTravels:
            storeRef.tools.fastTravels = window;
            width = 670;
            height = 527;
            break;
          case WindowIds.LoaderGrabber:
            storeRef.tools.loaderGrabber = window;
            width = 800;
            height = 517;
            break;
          case WindowIds.Follower:
            storeRef.tools.follower = window;
            width = 927;
            height = 646;
            break;
          case WindowIds.Hotkeys:
            storeRef.tools.hotkeys = window;
            width = 600;
            height = 400;
            break;
          case WindowIds.PacketLogger:
            storeRef.packets.logger = window;
            width = 797;
            height = 523;
            break;
          case WindowIds.PacketSpammer:
            storeRef.packets.spammer = window;
            width = 608;
            height = 403;
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

        await window.loadFile(path!);
      }),
    getAssetPath: tipcInstance.procedure.action(async () => {
      if (app.isPackaged) {
        console.log(`returning ${join(app.getAppPath())}`);
        return join(app.getAppPath(), "assets");
      } else {
        return join(DIST_PATH, "../../assets");
      }
    }),
  };
}
