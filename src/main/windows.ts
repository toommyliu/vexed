import { join, resolve } from "path";
import { getRendererHandlers } from "@egoist/tipc/main";
import { app, BrowserWindow } from "electron";
import { BRAND } from "../common/constants";
import { ipcMain } from "../common/ipc";
import { IPC_EVENTS } from "../common/ipc-events";
import { Logger } from "../common/logger";
import type { RendererHandlers } from "./tipc/renderer-handlers";
import { recursivelyApplySecurityPolicy } from "./util/recursivelyApplySecurityPolicy";

const PUBLIC = join(__dirname, "../../public/");
const PUBLIC_GAME = join(PUBLIC, "game/");
const PUBLIC_MANAGER = join(PUBLIC, "manager/");

const logger = Logger.get("Windows");

export const store: WindowStore = new Map();

// eslint-disable-next-line import-x/no-mutable-exports
export let mgrWindow: BrowserWindow | null;

export async function createAccountManager(): Promise<void> {
  if (mgrWindow) {
    mgrWindow.show();
    mgrWindow.focus();
    return;
  }

  const window = new BrowserWindow({
    width: 966,
    height: 552,
    title: BRAND,
    webPreferences: {
      nodeIntegration: true,
    },
    useContentSize: true,
  });
  window.on("close", (ev) => {
    ev.preventDefault();
    window.hide();
  });
  mgrWindow = window;

  recursivelyApplySecurityPolicy(window);
  void window.loadURL(`file://${resolve(PUBLIC_MANAGER, "index.html")}`);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: "right" });
  }
}

export async function createGame(
  account: AccountWithServer | null = null,
): Promise<void> {
  const args: string[] = [];
  if (account?.username) {
    args.push(`--username=${account.username}`);
  }

  if (account?.password) {
    args.push(`--password=${account.password}`);
  }

  if (account?.server) {
    args.push(`--server=${account.server}`);
  }

  if (account?.scriptPath) {
    const encodedScriptPath = encodeURIComponent(account.scriptPath);
    args.push(`--scriptPath=${encodedScriptPath}`);
  }

  const window = new BrowserWindow({
    width: 966,
    height: 552,
    title: BRAND,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      plugins: true,
      // Pass CLI args for "Login with Account" feature
      additionalArguments: args,
      webgl: false,
    },
    ...(account?.username
      ? { tabbingIdentifier: `game-${account?.username}` }
      : {}),
    useContentSize: true,
  });

  void window.loadURL(`file://${resolve(PUBLIC_GAME, "index.html")}`);
  recursivelyApplySecurityPolicy(window);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: "right" });
  }

  // TODO: clean when everything else is migrated

  // Register main to renderer IPC calls
  const handlers = getRendererHandlers<RendererHandlers>(window.webContents);
  ipcMain.answerRenderer("root:login-success", async ({ username }) => {
    console.log("root:login-success", username);

    if (!mgrWindow) return;

    logger.info(`User ${username} logged in successfully.`);

    handlers.enableButton.send(username);
  });

  // Track refreshes to re-sync states across windows
  window.webContents.on("did-finish-load", async () => {
    logger.info("game window re(loaded)");

    if (!window || window?.isDestroyed()) {
      return;
    }

    const windows = store.get(window.id);

    if (windows) {
      try {
        for (const child of Object.values(windows.tools)) {
          if (child && !child.isDestroyed()) {
            await ipcMain.callRenderer(child!, IPC_EVENTS.REFRESHED);
          }
        }

        for (const child of Object.values(windows.packets)) {
          if (child && !child.isDestroyed()) {
            await ipcMain.callRenderer(child!, IPC_EVENTS.REFRESHED);
          }
        }
      } catch {}
    }
  });

  window.on("close", () => {
    const windows = store.get(window.id);
    if (windows) {
      for (const child of Object.values(windows.tools)) {
        if (child && !child.isDestroyed()) {
          child.destroy();
        }
      }

      for (const child of Object.values(windows.packets)) {
        if (child && !child.isDestroyed()) {
          child.destroy();
        }
      }

      store.delete(window.id);
    }
  });

  store.set(window.id, {
    game: window,
    tools: { fastTravels: null, loaderGrabber: null, follower: null },
    packets: { logger: null, spammer: null },
  });
}

// TODO: refactor

export type WindowStore = Map<
  number,
  {
    game: BrowserWindow;
    packets: {
      logger: BrowserWindow | null;
      spammer: BrowserWindow | null;
    };
    tools: {
      fastTravels: BrowserWindow | null;
      follower: BrowserWindow | null;
      loaderGrabber: BrowserWindow | null;
    };
  }
>;
