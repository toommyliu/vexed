import { join, resolve } from "path";
import { BrowserWindow } from "electron";
import { BRAND } from "../shared/constants";
import { DIST_PATH, IS_PACKAGED } from "./constants";
import { applySecurityPolicy } from "./util/applySecurityPolicy";

const DIST_GAME = join(DIST_PATH, "game/");
const DIST_MANAGER = join(DIST_PATH, "manager/");

let mgrWindow: BrowserWindow | null;
let isQuitting = false;

export const windowStore: WindowStore = new Map();

export function getManagerWindow(): BrowserWindow | null {
  return mgrWindow;
}

export function setQuitting(quitting: boolean): void {
  isQuitting = quitting;
}

export async function createAccountManager(): Promise<void> {
  if (mgrWindow && !mgrWindow.isDestroyed()) {
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
    // App is quitting, allow the window to close
    if (isQuitting) {
      return;
    }

    ev.preventDefault();
    window.hide();
  });

  window.on("closed", () => {
    mgrWindow = null;
  });

  mgrWindow = window;

  applySecurityPolicy(window);
  void window.loadURL(`file://${resolve(DIST_MANAGER, "index.html")}`);

  if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });
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

  void window.loadURL(`file://${resolve(DIST_GAME, "index.html")}`);
  window.webContents.setAudioMuted(true);
  applySecurityPolicy(window);

  if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });

  window.on("close", () => {
    const windows = windowStore.get(window?.id);
    if (windows) {
      const toClose = [
        ...Object.values(windows.tools),
        ...Object.values(windows.packets),
      ];

      for (const window of toClose) {
        if (
          window &&
          !window?.isDestroyed() &&
          !window?.webContents?.isDestroyed()
        ) {
          window.destroy();
        }
      }

      windowStore.delete(window.id);
    }
  });

  windowStore.set(window.id, {
    game: window,
    tools: {
      fastTravels: null,
      loaderGrabber: null,
      follower: null,
      hotkeys: null,
    },
    packets: { logger: null, spammer: null },
  });
}

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
      hotkeys: BrowserWindow | null;
      loaderGrabber: BrowserWindow | null;
    };
  }
>;
