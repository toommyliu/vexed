import { join, resolve } from "path";
import process from "process";
import { app, BrowserWindow } from "electron";
import { BRAND } from "../shared/constants";
import { recursivelyApplySecurityPolicy } from "./util/recursivelyApplySecurityPolicy";

const DIST = join(__dirname, "../../dist/");
const DIST_GAME = join(DIST, "game/");
const DIST_MANAGER = join(DIST, "manager/");

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
  void window.loadURL(`file://${resolve(DIST_MANAGER, "index.html")}`);

  if (!app.isPackaged) {
    window.webContents.openDevTools({ mode: "right" });
  }
}

export async function createGame(
  account: AccountWithServer | null = null,
): Promise<void> {
  const args: string[] = [];

  const usernameArgv = process.argv
    .find((arg) => arg.startsWith("--username="))
    ?.split("=")[1];
  const username = account?.username ?? usernameArgv;
  if (username) {
    args.push(`--username=${username}`);
  }

  const passwordArgv = process.argv
    .find((arg) => arg.startsWith("--password="))
    ?.split("=")[1];
  const password = account?.password ?? passwordArgv;
  if (password) {
    args.push(`--password=${password}`);
  }

  const serverArgv = process.argv
    .find((arg) => arg.startsWith("--server="))
    ?.split("=")[1];
  const server = account?.server ?? serverArgv;
  if (server) {
    args.push(`--server=${server}`);
  }

  const scriptPathArgv = process.argv
    .find((arg) => arg.startsWith("--scriptPath="))
    ?.split("=")[1];
  const scriptPath = account?.scriptPath ?? scriptPathArgv;
  if (scriptPath) {
    const encodedScriptPath = encodeURIComponent(scriptPath);
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
  recursivelyApplySecurityPolicy(window);

  // if (!app.isPackaged) {
  window.webContents.openDevTools({ mode: "right" });
  // }

  window.on("close", () => {
    const windows = windowStore.get(window?.id);
    if (windows) {
      const toClose = [
        ...Object.values(windows.tools),
        ...Object.values(windows.packets),
      ];

      for (const window of toClose) {
        if (window && !window.isDestroyed()) {
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
