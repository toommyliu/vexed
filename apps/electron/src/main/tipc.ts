import { join } from "path";
import { getRendererHandlers, tipc } from "@egoist/tipc";
import { app, BrowserWindow, dialog } from "electron";
import { sleep } from "sleep";
import { FileManager } from "../shared/FileManager";
import { DEFAULT_FAST_TRAVELS } from "../shared/constants";
import { Logger } from "../shared/logger";
import type {
  FastTravel,
  FastTravelRoomNumber,
  GrabberDataType,
  LoaderDataType,
} from "../shared/types";
import { WindowIds } from "../shared/types";
import { recursivelyApplySecurityPolicy } from "./util/recursivelyApplySecurityPolicy";
import { createGame, getManagerWindow, windowStore } from "./windows";

const tipcInstance = tipc.create();
const logger = Logger.get("IpcMain");
const DIST_PATH = join(__dirname, "../../dist/");

type PlayerStatus = {
  done: Set<string>; // set of players done
  leader: string; // playerName of the leader
  playerList: Set<string>; // set of playerName, including leader
  windows: Map<string, BrowserWindow>; // playerName -> browser window
};
const map: Map<
  string, // config fileName
  PlayerStatus
> = new Map();
const windowToPlayerMap: WeakMap<BrowserWindow, string> = new WeakMap();

// Cleanup map to get a clean state (useful for testing when reloading the window)
const handleCleanup = (
  browserWindow: BrowserWindow,
  configFileName?: string,
) => {
  // only useful for Leader?
  const _cleanup = () => {
    if (configFileName) {
      map.delete(configFileName);
      console.log(`Leader disconnected, cleaned up: ${configFileName}`);
    }
  };

  browserWindow.webContents.once("did-finish-load", _cleanup);
  browserWindow.once("close", _cleanup);
};

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

      if (!app.isPackaged) {
        window.webContents.openDevTools({ mode: "right" });
      }

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
  gameReload: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    for (const child of browserWindow.getChildWindows()) {
      if (child && !child.isDestroyed()) {
        const rendererHandlers = getRendererHandlers<RendererHandlers>(
          child.webContents,
        );
        rendererHandlers.gameReloaded.send();
      }
    }
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

  // #region Packet Logger
  packetLoggerStart: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    const parent = browserWindow.getParentWindow();
    if (!parent || !windowStore.has(parent.id)) return;

    const parentHandlers = getRendererHandlers<RendererHandlers>(
      parent.webContents,
    );
    parentHandlers.packetLoggerStart.send();
  }),
  packetLoggerStop: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    const parent = browserWindow.getParentWindow();
    if (!parent || !windowStore.has(parent.id)) return;

    const parentHandlers = getRendererHandlers<RendererHandlers>(
      parent.webContents,
    );
    parentHandlers.packetLoggerStop.send();
  }),
  packetLoggerPacket: tipcInstance.procedure
    .input<{ packet: string; type: string }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const packetLoggerWindow = windowStore.get(browserWindow.id)?.packets
        ?.logger;
      if (!packetLoggerWindow || packetLoggerWindow.isDestroyed()) return;

      const rendererHandler = getRendererHandlers<RendererHandlers>(
        packetLoggerWindow.webContents,
      );
      rendererHandler.packetLoggerPacket.send(input);
    }),
  // #endregion

  // #region Packet Spammer
  packetSpammerStart: tipcInstance.procedure
    .input<{
      delay: number;
      packets: string[];
    }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) return;

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      parentHandlers.packetSpammerStart.send(input);
    }),
  packetSpammerStop: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    const parent = browserWindow.getParentWindow();
    if (!parent || !windowStore.has(parent.id)) return;

    const parentHandlers = getRendererHandlers<RendererHandlers>(
      parent.webContents,
    );
    parentHandlers.packetSpammerStop.send();
  }),
  // #endregion

  // #region Armying
  armyInit: tipcInstance.procedure
    .input<{ fileName: string; playerName: string; players: string[] }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const { fileName, playerName, players } = input;

      const windows = new Map<string, BrowserWindow>();
      windows.set(playerName, browserWindow);
      windowToPlayerMap.set(browserWindow, playerName);

      const playerStatus = {
        done: new Set<string>(),
        leader: playerName,
        playerList: new Set(players),
        windows,
      };
      map.set(fileName, playerStatus);

      handleCleanup(browserWindow, fileName);

      // console.log("Army init done");
    }),
  armyJoin: tipcInstance.procedure
    .input<{ fileName: string; playerName: string }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) return;

      const { fileName, playerName } = input;
      let iter = 0;

      while (!map.has(fileName)) {
        // if (iter % 100 === 0) {
        //   console.log(`${playerName} waiting for army init...`);
        // }

        await sleep(100);
        iter++;
      }

      await sleep(1_000);

      const { windows } = map.get(fileName)!;
      windows.set(playerName, browserWindow);
      windowToPlayerMap.set(browserWindow, playerName);

      handleCleanup(browserWindow);

      // console.log("Joined army", input);
    }),
  armyFinishJob: tipcInstance.procedure.action(async ({ context }) => {
    const browserWindow = BrowserWindow.fromWebContents(context.sender);
    if (!browserWindow) return;

    const playerName = windowToPlayerMap.get(browserWindow);
    if (!playerName) {
      // console.warn("No player name found for browser window");
      return;
    }

    // console.log(`Player ${playerName} finished job`);

    // Update the map to mark this player as done
    const fileName = [...map.keys()].find((fileName) =>
      map.get(fileName)?.windows.has(playerName),
    );
    if (!fileName) {
      // console.warn("No file name found for browser window");
      return;
    }

    const { done: doneSet, windows, playerList, leader } = map.get(fileName)!;
    doneSet.add(playerName);
    // console.log(`Player ${playerName} is done`);

    if (playerName !== leader) {
      // console.log("Not leader, waiting for leader to finish job");
      return;
    }

    let iter = 0;

    while (doneSet.size !== playerList.size && map.has(fileName)) {
      // if (iter % 100 === 0) {
      //   console.log(
      //     `Leader: Waiting for all players to finish job: ${Array.from(
      //       playerList,
      //     )
      //       .filter((player) => !doneSet.has(player))
      //       .join(", ")} (${doneSet.size}/${playerList.size})`,
      //   );
      // }

      await sleep(100);

      iter++;
    }

    if (!map.has(fileName)) {
      // console.log("(2) Map has been cleared, exiting");
      return;
    }

    // console.log("All players are done and ready");

    // All players are done, send ready to all windows
    for (const [_, window] of windows) {
      const rendererHandlers = getRendererHandlers<RendererHandlers>(
        window.webContents,
      );
      await rendererHandlers.armyReady.invoke();
    }

    // IMPORTANT: Only clear the set after all messages are sent
    doneSet.clear();
  }),
  // #endregion

  // #region Hotkeys
  updateHotkey: tipcInstance.procedure
    .input<{
      id: string;
      value: string;
    }>()
    .action(async ({ input, context }) => {
      const browserWindow = BrowserWindow.fromWebContents(context.sender);
      if (!browserWindow) {
        console.log("No browser window found for hotkey update");
        return;
      }

      const parent = browserWindow.getParentWindow();
      if (!parent || !windowStore.has(parent.id)) {
        console.log("No parent window found for hotkey update");
        return;
      }

      const parentHandlers = getRendererHandlers<RendererHandlers>(
        parent.webContents,
      );
      await parentHandlers.hotkeysUpdate.invoke(input);
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
  updateAccount: tipcInstance.procedure
    .input<{
      originalUsername: string;
      updatedAccount: Account;
    }>()
    .action(async ({ input }) => {
      try {
        const accounts =
          (await FileManager.readJson<Account[]>(FileManager.accountsPath)) ??
          [];

        const idx = accounts.findIndex(
          (acc) => acc.username === input.originalUsername,
        );
        if (idx === -1) return false;

        if (input.updatedAccount.username !== input.originalUsername) {
          const existingIdx = accounts.findIndex(
            (acc) => acc.username === input.updatedAccount.username,
          );
          if (existingIdx !== -1) return false;
        }

        accounts[idx] = input.updatedAccount;
        await FileManager.writeJson(FileManager.accountsPath, accounts);
        return true;
      } catch (error) {
        logger.error("Failed to update account", error);
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
      if (!browserWindow) return;

      const window = getManagerWindow();
      if (!window) return;

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
  // Game
  gameReloaded(): void;

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

  // Hotkeys
  hotkeysUpdate(input: { id: string; value: string }): Promise<void>;

  // Packet Logger
  packetLoggerStart(): void;
  packetLoggerStop(): void;
  packetLoggerPacket(input: { packet: string; type: string }): void;

  // Packet Spammer
  packetSpammerStart(input: { delay: number; packets: string[] }): void;
  packetSpammerStop(): void;

  // Armying
  armyReady(): Promise<void>;

  // Manager
  managerLoginSuccess(username: string): void;
  enableButton(username: string): Promise<void>;
};
/* eslint-enable typescript-sort-keys/interface */
