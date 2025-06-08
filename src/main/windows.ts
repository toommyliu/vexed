import { join, resolve } from "path";
import { app, BrowserWindow } from "electron";
import { BRAND } from "../common/constants";
import { Logger } from "../common/logger";
import { recursivelyApplySecurityPolicy } from "./util/recursivelyApplySecurityPolicy";

const PUBLIC = join(__dirname, "../../public/");
const PUBLIC_GAME = join(PUBLIC, "game/");
const PUBLIC_MANAGER = join(PUBLIC, "manager/");

const logger = Logger.get("Windows");

let mgrWindow: BrowserWindow | null;

export const windowStore: WindowStore = new Map();

export function getManagerWindow(): BrowserWindow | null {
  return mgrWindow;
}

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

  window.on("close", () => {
    const windows = windowStore.get(window.id);
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

      windowStore.delete(window.id);
    }
  });

  windowStore.set(window.id, {
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
