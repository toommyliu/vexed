import { join, resolve } from "path";
import { BrowserWindow, screen } from "electron";
import type { AccountWithScript } from "~/shared/types";
import { BRAND, DIST_PATH, IS_PACKAGED } from "../constants";
import { getSettings } from "../settings";
import { cleanupEnvironmentState } from "../tipc/environment";
import { applySecurityPolicy } from "../util/applySecurityPolicy";

const DIST_GAME = join(DIST_PATH, "game/");
const DIST_MANAGER = join(DIST_PATH, "manager/");
const DIST_ONBOARDING = join(DIST_PATH, "onboarding/");

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

class WindowsService {
  private windowStore: WindowStore = new Map();

  private mgrWindow: BrowserWindow | null = null;

  private onboardingWindow: BrowserWindow | null = null;

  private isQuitting = false;

  private onboardingRequestedToShow = false;

  private onboardingReadyToShow = false;

  public setQuitting(value: boolean): void {
    this.isQuitting = value;
  }

  public getManagerWindow(): BrowserWindow | null {
    return this.mgrWindow;
  }

  public getWindowStore(): WindowStore {
    return this.windowStore;
  }

  public async prewarmOnboarding(): Promise<void> {
    if (this.onboardingWindow && !this.onboardingWindow.isDestroyed()) return;

    this.onboardingRequestedToShow = false;
    this.onboardingReadyToShow = false;

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

    this.onboardingWindow = window;

    window.once("ready-to-show", () => {
      this.onboardingReadyToShow = true;
      if (this.onboardingRequestedToShow && !window.isDestroyed()) {
        window.show();
        window.focus();
      }
    });

    window.on("close", (ev) => {
      if (this.isQuitting) return;
      ev.preventDefault();
      window.hide();
      void getSettings().save();
    });

    window.on("closed", () => {
      this.onboardingWindow = null;
      this.onboardingRequestedToShow = false;
      this.onboardingReadyToShow = false;
      void getSettings().save();
    });

    applySecurityPolicy(window);
    void window.loadURL(`file://${resolve(DIST_ONBOARDING, "index.html")}`);
  }

  public async createOnboarding(): Promise<void> {
    this.onboardingRequestedToShow = true;

    if (!this.onboardingWindow || this.onboardingWindow.isDestroyed()) {
      await this.prewarmOnboarding();
    }

    if (!this.onboardingWindow || this.onboardingWindow.isDestroyed()) return;

    if (this.onboardingReadyToShow) {
      this.onboardingWindow.show();
      this.onboardingWindow.focus();
    }
  }

  public async createAccountManager(): Promise<void> {
    if (this.mgrWindow && !this.mgrWindow.isDestroyed()) {
      this.mgrWindow.show();
      this.mgrWindow.focus();
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
      if (this.isQuitting) {
        return;
      }

      ev.preventDefault();
      window.hide();
    });

    window.on("closed", () => {
      this.mgrWindow = null;
    });

    this.mgrWindow = window;

    applySecurityPolicy(window);
    void window.loadURL(`file://${resolve(DIST_MANAGER, "index.html")}`);

    if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });
  }

  public async createGame(
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

    this.windowStore.set(window.id, {
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

      const windows = this.windowStore.get(window.id);
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

        this.windowStore.delete(window.id);
        cleanupEnvironmentState(window.id);
      }
    });
  }
}

export const windowsService = new WindowsService();
