import { join, resolve } from "path";
import { BrowserWindow, screen } from "electron";
import { BRAND } from "../shared/constants";
import type { AccountWithScript } from "../shared/types";
import { DIST_PATH, IS_PACKAGED } from "./constants";
import { getSettings } from "./settings";
import { cleanupEnvironmentState } from "./tipc/environment";
import { applySecurityPolicy } from "./util/applySecurityPolicy";

/**
 * Gets the x/y position to center a window on the monitor where the cursor is located.
 */
function getCenteredPosition(
  width: number,
  height: number,
): { x: number; y: number } {
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const { workArea } = display;

  return {
    x: workArea.x + Math.floor((workArea.width - width) / 2),
    y: workArea.y + Math.floor((workArea.height - height) / 2),
  };
}

const DIST_GAME = join(DIST_PATH, "game/");
const DIST_MANAGER = join(DIST_PATH, "manager/");
const DIST_ONBOARDING = join(DIST_PATH, "onboarding/"); // settings

let mgrWindow: BrowserWindow | null;
let onboardingWindow: BrowserWindow | null;
let isQuitting = false;

let onboardingRequestedToShow = false;
let onboardingReadyToShow = false;

export const windowStore: WindowStore = new Map();

export function getManagerWindow(): BrowserWindow | null {
  return mgrWindow;
}

export function setQuitting(quitting: boolean): void {
  isQuitting = quitting;
}

export async function prewarmOnboarding(): Promise<void> {
  if (onboardingWindow && !onboardingWindow.isDestroyed()) return;

  onboardingRequestedToShow = false;
  onboardingReadyToShow = false;

  const width = 320;
  const height = 320;
  const { x, y } = getCenteredPosition(width, height);

  const window = new BrowserWindow({
    width,
    height,
    x,
    y,
    title: BRAND,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
  });

  onboardingWindow = window;

  window.once("ready-to-show", () => {
    onboardingReadyToShow = true;
    if (onboardingRequestedToShow && !window.isDestroyed()) {
      window.show();
      window.focus();
    }
  });

  window.on("close", (ev) => {
    if (isQuitting) return;
    ev.preventDefault();
    window.hide();
    void getSettings().save();
  });

  window.on("closed", () => {
    onboardingWindow = null;
    onboardingRequestedToShow = false;
    onboardingReadyToShow = false;
    void getSettings().save();
  });

  applySecurityPolicy(window);
  void window.loadURL(`file://${resolve(DIST_ONBOARDING, "index.html")}`);
}

export async function createOnboarding(): Promise<void> {
  onboardingRequestedToShow = true;

  if (!onboardingWindow || onboardingWindow.isDestroyed()) {
    await prewarmOnboarding();
  }

  if (!onboardingWindow || onboardingWindow.isDestroyed()) return;

  if (onboardingReadyToShow) {
    onboardingWindow.show();
    onboardingWindow.focus();
  }
}

export async function createAccountManager(): Promise<void> {
  if (mgrWindow && !mgrWindow.isDestroyed()) {
    mgrWindow.show();
    mgrWindow.focus();
    return;
  }

  const width = 966;
  const height = 552;
  const { x, y } = getCenteredPosition(width, height);

  const window = new BrowserWindow({
    width,
    height,
    x,
    y,
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
  account: AccountWithScript | null = null,
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

  const width = 966;
  const height = 552;
  const { x, y } = getCenteredPosition(width, height);

  const window = new BrowserWindow({
    width,
    height,
    x,
    y,
    title: BRAND,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      plugins: true,
      additionalArguments: args,
      webgl: false,
    },
    ...(account?.username
      ? { tabbingIdentifier: `game-${account?.username}` }
      : {}),
    useContentSize: true,
  });

  windowStore.set(window.id, {
    app: {
      environment: null,
      hotkeys: null,
    },
    game: window,
    tools: {
      fastTravels: null,
      loaderGrabber: null,
      follower: null,
    },
    packets: { logger: null, spammer: null },
  });

  void window.loadURL(`file://${resolve(DIST_GAME, "index.html")}`);
  applySecurityPolicy(window);

  if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });

  window.on("close", () => {
    if (!window || window.isDestroyed() || window.webContents.isDestroyed()) {
      console.log("window is destroyed", window);
      return;
    }

    const windows = windowStore.get(window.id);
    if (windows) {
      const toClose = [
        windows.app.environment,
        ...Object.values(windows.tools),
        ...Object.values(windows.packets),
      ];

      for (const childWindow of toClose) {
        if (
          childWindow &&
          !childWindow?.isDestroyed() &&
          !childWindow?.webContents?.isDestroyed()
        ) {
          childWindow.destroy();
        }
      }

      windowStore.delete(window.id);
      cleanupEnvironmentState(window.id);
    }
  });
}

export type WindowStore = Map<
  number,
  {
    app: {
      environment: BrowserWindow | null;
      hotkeys: BrowserWindow | null;
    };
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
