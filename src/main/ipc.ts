import { join } from "path";
import { getRendererHandlers, tipc } from "@egoist/tipc";
import { app, BrowserWindow, dialog } from "electron";
import { FileManager } from "../common/FileManager";
import { DEFAULT_FAST_TRAVELS } from "../common/constants";
import { Logger } from "../common/logger";
import { WindowIds } from "../shared/constants";
import type {
  GrabberDataType,
  LoaderDataType,
  FastTravel,
  FastTravelRoomNumber,
} from "../shared/types";
import { recursivelyApplySecurityPolicy } from "./util/recursivelyApplySecurityPolicy";
import { createGame, windowStore, getManagerWindow } from "./windows";

const tipcInstance = tipc.create();
const logger = Logger.get("IpcMain");
const BASE_PATH = join(__dirname, "../../public/game/");

// TODO: <WebContents>.reloadIgnoringCache() to send refresh events to all childern

// Renderer calls to main (1.)
export const router = {
  // #region Game
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
          path = join(BASE_PATH, "tools", "fast-travels", "index.html");
          break;
        case WindowIds.LoaderGrabber:
          ref = storeRef.tools.loaderGrabber;
          path = join(BASE_PATH, "tools", "loader-grabber", "index.html");
          break;
        case WindowIds.Follower:
          ref = storeRef.tools.follower;
          path = join(BASE_PATH, "tools", "follower", "index.html");
          break;
        case WindowIds.PacketLogger:
          ref = storeRef.packets.logger;
          break;
        case WindowIds.PacketSpammer:
          ref = storeRef.packets.spammer;
          break;
      }

      // Restore the previously created window
      if (ref && !ref?.isDestroyed()) {
        ref.show();
        ref.focus();
        return;
      }

      logger.info(`Creating new window for: ${input}`);

      // Create it
      const window = new BrowserWindow({
        title: "",
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: true,
        },
        // Parent is required in order to maintain parent-child relationships and for ipc calls
        // Moving the parent also moves the child, as well as minimizing it
        parent: browserWindow,
        width: width!,
        minWidth: width!,
        minHeight: height!,
        height: height!,
        // When a child window is minimized, the parent window is also minimized,
        // which is not desired. See https://github.com/electron/electron/issues/26031
        minimizable: false,
        show: false,
      });

      // Update the store with the new window
      switch (input) {
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

      if (!app.isPackaged) window.webContents.openDevTools({ mode: "right" });

      recursivelyApplySecurityPolicy(window);

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
  // #region Scripts
  loadScript: tipcInstance.procedure
    .input<{ scriptPath: string }>()
    .action(async ({ input, context }) => {
      try {
        const scriptPath = input?.scriptPath;
        const browserWindow = BrowserWindow.fromWebContents(context.sender);
        const handlers = getRendererHandlers<RendererHandlers>(context.sender);

        let file: string;
        let fromManager = false;

        if (scriptPath) {
          file = scriptPath;
          fromManager = true;
        } else {
          const res = await dialog
            .showOpenDialog(browserWindow, {
              defaultPath: join(FileManager.basePath, "Bots"),
              properties: ["openFile"],
              filters: [{ name: "Bots", extensions: ["js"] }],
              message: "Select a script to load",
              title: "Select a script to load",
            })
            .catch(() => ({ canceled: true, filePaths: [] }));
          if (res?.canceled || !res?.filePaths?.[0]) return;
          file = res.filePaths[0];
        }

        const content = await FileManager.readFile(file);
        if (!content) return;

        // The error is thrown in the renderer
        // So we need to listen for it here and handle it
        browserWindow.webContents.once(
          "console-message",
          async (_, level, message, line) => {
            if (!message.startsWith("Uncaught") || level !== 3) {
              return;
            }

            const args = message.slice("Uncaught".length).split(":");

            const err = args[0]!; // Error
            const _msg = args
              .join(" ")
              .slice(err!.length + 1)
              .trim();

            // ArgsError
            if (level === 3 && _msg.startsWith("Invalid args")) {
              const split = _msg.split(";"); // Invalid args;delay;ms is required
              const cmd = split[1]!; // delay
              const cmd_msg = split[2]!; // ms is required

              try {
                // Reset the commands
                await browserWindow.webContents.executeJavaScript(
                  "window.context.setCommands([])",
                );

                // Ideally, this traces to the line of the (user) script back to
                // where the error occurred, not where the error is thrown internally
                await dialog.showMessageBox(browserWindow, {
                  message: `"cmd.${cmd}()" threw an error: ${cmd_msg}`,
                  type: "error",
                });
              } catch {}
            } else {
              // Some generic error (SyntaxError, ReferenceError, etc.)
              await dialog.showMessageBox(browserWindow, {
                message: err,
                detail: `${_msg} (line ${line})`,
                type: "error",
              });
            }
          },
        );

        // Reset to clean state
        await context.sender.executeJavaScript(
          "window.context.setCommands([]);window.context.commandIndex=0;",
        );

        // Load the script
        await context.sender.executeJavaScript(content!);
        handlers.scriptLoaded.send(fromManager);

        browserWindow.webContents.removeAllListeners("console-message");
      } catch {}
    }),
  toggleDevTools: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    browserWindow?.webContents?.toggleDevTools();
  }),
  // #endregion
  // #region Fast Travels
  getFastTravels: tipcInstance.procedure.action(async () => {
    try {
      return await FileManager.readJson<FastTravel[]>(
        FileManager.fastTravelsPath,
      )!;
    } catch (error) {
      logger.error("Failed to read fast travels", error);
      return DEFAULT_FAST_TRAVELS;
    }
  }),
  doFastTravel: tipcInstance.procedure
    .input<{ location: FastTravelRoomNumber }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      const childHandlers = getRendererHandlers<RendererHandlers>(
        context.sender,
      );

      await parentHandlers.doFastTravel.invoke({ location: input.location });
      childHandlers.fastTravelEnable.send();
    }),
  // #endregion
  // #endregion
  // #region Loader Grabber
  load: tipcInstance.procedure
    .input<{ id: number; type: LoaderDataType }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );

      parentHandlers.load.send(input);
    }),
  grab: tipcInstance.procedure
    .input<{ type: GrabberDataType }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );

      return parentHandlers.grab.invoke({ type: input.type });
    }),
  // #endregion

  // #region Follower
  followerMe: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    const parent = browserWindow.getParentWindow();
    if (!parent || !windowStore.has(parent.id)) return;

    const parentHandlers = getRendererHandlers<RendererHandlers>(
      parent.webContents,
    );

    return parentHandlers.followerMe.invoke();
  }),
  followerStart: tipcInstance.procedure
    .input<{
      antiCounter: boolean;
      attackPriority: string;
      copyWalk: boolean;
      drops: string;
      name: string;
      quests: string;
      rejectElse: boolean;
      safeSkill: string;
      safeSkillEnabled: boolean;
      safeSkillHp: string;
      skillDelay: string;
      skillList: string;
      skillWait: boolean;
    }>()
    .action(async ({ context, input }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.followerStart.send(input);
    }),
  followerStop: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    const parent = browserWindow.getParentWindow();
    if (!parent || !windowStore.has(parent.id)) return;

    const parentHandlers = getRendererHandlers<RendererHandlers>(
      parent.webContents,
    );
    parentHandlers.followerStop.send();
  }),

  // #endregion
  // #region Manager
  getAccounts: tipcInstance.procedure.action(async () => {
    try {
      return await FileManager.readJson<Account[]>(FileManager.accountsPath);
    } catch {
      return [];
    }
  }),
  addAccount: tipcInstance.procedure
    .input<Account>()
    .action(async ({ input }) => {
      try {
        const accounts =
          (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ??
          [];

        const idx = accounts.findIndex(
          (acc) => acc.username === input.username,
        );
        if (idx !== -1) return false;

        accounts.push(input);
        await FileManager.writeJson(FileManager.accountsPath, accounts);
        return true;
      } catch (error) {
        logger.error("Failed to add account", error);
        return false;
      }
    }),
  removeAccount: tipcInstance.procedure
    .input<{
      username: string;
    }>()
    .action(async ({ input }) => {
      try {
        const accounts =
          (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ??
          [];

        const idx = accounts.findIndex(
          (acc) => acc.username === input.username,
        );
        if (idx === -1) return false;

        accounts.splice(idx, 1);
        await FileManager.writeJson(FileManager.accountsPath, accounts);
        return true;
      } catch (error) {
        logger.error("Failed to remove account", error);
        return false;
      }
    }),
  mgrLoadScript: tipcInstance.procedure.action(async ({ context }) => {
    try {
      const res = await dialog.showOpenDialog(
        BrowserWindow.fromWebContents(context.sender),
        {
          defaultPath: join(FileManager.basePath, "Bots"),
          properties: ["openFile"],
          filters: [{ name: "Bots", extensions: ["js"] }],
          message: "Select a script to load",
          title: "Select a script to load",
        },
      );

      if (res?.canceled || !res?.filePaths?.length) return "";

      return res?.filePaths[0] ?? "";
    } catch {
      return "";
    }
  }),
  launchGame: tipcInstance.procedure
    .input<AccountWithServer>()
    .action(async ({ input }) => {
      logger.info(`Launching game for: ${input.username}`);
      await createGame(input);
    }),
  managerLoginSuccess: tipcInstance.procedure
    .input<{ username: string }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) {
        console.log("no browser window found");
        return;
      }

      const window = getManagerWindow();
      if (!window) {
        console.log("no manager window found");
        return;
      }

      const handlers = getRendererHandlers<RendererHandlers>(
        window.webContents,
      );
      handlers.enableButton.send(input.username);

      logger.info(`User ${input.username} logged in successfully`);
    }),
  // #endregion
};

export type TipcRouter = typeof router;

/* eslint-disable typescript-sort-keys/interface */

// Main calls back to renderer (2.)
// !! Any renderer define these handlers !!
export type RendererHandlers = {
  // Scripts
  scriptLoaded(fromManager: boolean): void;

  // Fast Travels
  fastTravelEnable(): void;
  doFastTravel({ location }: { location: FastTravelRoomNumber }): void;

  // Loader Grabber
  load(input: { type: LoaderDataType; id: number }): void;
  grab(input: { type: GrabberDataType }): Promise<unknown>;

  // Follower
  followerMe(): Promise<string>;
  followerStart(input: {
    antiCounter: boolean;
    attackPriority: string;
    copyWalk: boolean;
    drops: string;
    name: string;
    quests: string;
    rejectElse: boolean;
    safeSkill: string;
    safeSkillEnabled: boolean;
    safeSkillHp: string;
    skillDelay: string;
    skillList: string;
    skillWait: boolean;
  }): Promise<void>;
  followerStop(): Promise<void>;

  // Manager
  managerLoginSuccess(username: string): void;
  enableButton(username: string): Promise<void>;
};
/* eslint-enable typescript-sort-keys/interface */
