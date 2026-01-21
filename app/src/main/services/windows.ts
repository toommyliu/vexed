import { join, resolve } from "path";
import { Result } from "better-result";
import { BrowserWindow, type BrowserWindowConstructorOptions } from "electron";
import { screen } from "electron";
import type { AccountWithScript, WindowIds } from "~/shared/types";
import { BRAND, DIST_PATH, IS_PACKAGED } from "../constants";
import { getSettings } from "../settings";
import { cleanupEnvironmentState } from "../tipc/environment";
import { applySecurityPolicy } from "../util/applySecurityPolicy";

const DIST_GAME = join(DIST_PATH, "game/");
const DIST_MANAGER = join(DIST_PATH, "manager/");
const DIST_ONBOARDING = join(DIST_PATH, "onboarding/"); // settings

type WindowStoreEntry = {
  game: BrowserWindow;
  subwindows: Map<WindowIds, BrowserWindow>;
};

type WindowStore = Map<number, WindowStoreEntry>;

export type SubwindowConfig = {
  height: number;
  path: string; // relative to DIST_PATH
  width: number;
};
export type SubwindowHandle = {
  close(): void;
  get(): BrowserWindow | null;
  open(config: SubwindowConfig): Promise<BrowserWindow>;
  readonly parent: BrowserWindow;
};

class SubwindowHandleImpl implements SubwindowHandle {
  public constructor(
    private readonly service: WindowsService,
    private readonly storeRef: WindowStoreEntry,
    private readonly gameWindowId: number,
    private readonly id: WindowIds,
  ) {}

  public get parent(): BrowserWindow {
    return this.storeRef.game;
  }

  public close(): void {
    this.get()?.destroy();
  }

  public get(): BrowserWindow | null {
    const win = this.storeRef.subwindows.get(this.id);
    return win && !win.isDestroyed() ? win : null;
  }

  public async open(config: SubwindowConfig): Promise<BrowserWindow> {
    const existing = this.get();
    if (existing) {
      existing.show();
      existing.focus();

      return existing;
    }

    return this.create(config);
  }

  private async create(config: SubwindowConfig): Promise<BrowserWindow> {
    const window = Result.unwrap(
      this.service.createWindow({
        title: "",
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: true,
        },
        useContentSize: true,
        width: config.width,
        minWidth: config.width,
        height: config.height,
        minHeight: config.height,
        minimizable: false,
        show: false,
      }),
    );

    // Register parent relationship
    this.service.registerSubwindow(this.gameWindowId, window.id);
    this.storeRef.subwindows.set(this.id, window);

    window.once("ready-to-show", () => {
      window.show();
    });

    window.on("close", (ev) => {
      ev.preventDefault();
      window.hide();
    });

    const subwindowId = window.id;
    window.on("closed", () => {
      this.service.unregisterSubwindow(subwindowId);
      this.storeRef.subwindows.delete(this.id);
    });

    await window.loadFile(join(DIST_PATH, config.path));

    return window;
  }
}

class WindowsService {
  private readonly windowStore: WindowStore = new Map();

  private readonly parentMap: Map<number, number> = new Map();

  private managerWindow: BrowserWindow | null = null;

  private onboardingWindow: BrowserWindow | null = null;

  private _isQuitting = false;

  public get isQuitting() {
    return this._isQuitting;
  }

  public setQuitting(quitting: boolean) {
    this._isQuitting = quitting;
  }

  public registerSubwindow(gameWindowId: number, subwindowId: number): void {
    this.parentMap.set(subwindowId, gameWindowId);
  }

  public unregisterSubwindow(subwindowId: number): void {
    this.parentMap.delete(subwindowId);
  }

  /**
   * Resolve any window ID → its parent game window.
   *
   * @param senderWindowId - The window ID to resolve from.
   */
  public resolveGameWindow(senderWindowId: number): BrowserWindow | null {
    const gameId = this.windowStore.has(senderWindowId)
      ? senderWindowId
      : this.parentMap.get(senderWindowId);
    if (!gameId) return null;
    return this.windowStore.get(gameId)?.game ?? null;
  }

  /**
   * Get a subwindow handle for a specific game window.
   *
   * @param gameWindowId - The game window ID.
   * @param id - The subwindow ID.
   */
  public subwindow(
    gameWindowId: number,
    id: WindowIds,
  ): SubwindowHandle | null {
    const storeRef = this.windowStore.get(gameWindowId);
    if (!storeRef) return null;
    return new SubwindowHandleImpl(this, storeRef, gameWindowId, id);
  }

  /**
   * Get a subwindow for a specific game window.
   *
   * @param gameWindowId - The game window ID.
   * @param id - The subwindow ID.
   */
  public getSubwindow(
    gameWindowId: number,
    id: WindowIds,
  ): BrowserWindow | null {
    const storeRef = this.windowStore.get(gameWindowId);
    if (!storeRef) return null;
    const win = storeRef.subwindows.get(id);
    return win && !win.isDestroyed() ? win : null;
  }

  /**
   * Check if a window is a game window.
   *
   * @param windowId - The window ID to check.
   */
  public isGameWindow(windowId: number): boolean {
    return this.windowStore.has(windowId);
  }

  /**
   * Get the game window id, from any window in its chain.
   *
   * @param windowId - The window id to resolve from.
   */
  public getGameWindowId(windowId: number): number | undefined {
    if (this.windowStore.has(windowId)) return windowId;
    return this.parentMap.get(windowId);
  }

  /**
   * Iterate over all game windows with their IDs.
   */
  public forEachGameWindow(
    fn: (gameWindowId: number, gameWindow: BrowserWindow) => void,
  ): void {
    for (const [gameWindowId, entry] of this.windowStore.entries()) {
      if (!entry.game.isDestroyed()) {
        fn(gameWindowId, entry.game);
      }
    }
  }

  public game(account: AccountWithScript | null = null) {
    const args: string[] = [];
    if (typeof account?.username === "string")
      args.push(`--username=${account.username}`);
    if (typeof account?.password === "string")
      args.push(`--password=${account.password}`);
    if (typeof account?.server === "string")
      args.push(`--server=${account.server}`);
    if (typeof account?.scriptPath === "string") {
      const encodedScriptPath = encodeURIComponent(account.scriptPath);
      args.push(`--scriptPath=${encodedScriptPath}`);
    }

    return Result.gen(function* () {
      const window = yield* this.createWindow({
        width: 966,
        height: 552,
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
      });
      const windowId = window.id;

      this.windowStore.set(windowId, {
        game: window,
        subwindows: new Map(),
      });

      window.on("close", () => {
        if (
          !window ||
          window?.isDestroyed() ||
          window?.webContents?.isDestroyed()
        )
          return;

        const entry = this.windowStore.get(windowId);
        if (entry) {
          for (const subwindow of entry.subwindows.values()) {
            if (!subwindow || subwindow?.isDestroyed()) continue;
            subwindow.destroy();
          }

          this.windowStore.delete(windowId);
          cleanupEnvironmentState(windowId);
        }
      });

      void window.loadURL(`file://${resolve(DIST_GAME, "index.html")}`);
      return Result.ok(window);
    }, this);
  }

  public manager() {
    if (this.managerWindow && !this.managerWindow.isDestroyed()) {
      this.managerWindow.show();
      this.managerWindow.focus();
      return Result.ok(this.managerWindow);
    }

    return Result.gen(function* () {
      const window = yield* this.createWindow({
        width: 966,
        height: 552,
        webPreferences: {
          nodeIntegration: true,
        },
        useContentSize: true,
      });

      window.on("close", (ev) => {
        if (this.isQuitting) return;
        ev.preventDefault();
        window.hide();
        void getSettings().save();
      });

      window.on("closed", () => {
        this.managerWindow = null;
        void getSettings().save();
      });

      this.managerWindow = window;

      void window.loadURL(`file://${resolve(DIST_MANAGER, "index.html")}`);
      return Result.ok(window);
    }, this);
  }

  public onboarding() {
    if (this.onboardingWindow && !this.onboardingWindow.isDestroyed()) {
      this.onboardingWindow.show();
      this.onboardingWindow.focus();
      return Result.ok(this.onboardingWindow);
    }

    return Result.gen(function* () {
      const window = yield* this.createWindow({
        width: 320,
        height: 320,
        webPreferences: {
          nodeIntegration: true,
        },
        resizable: false,
        maximizable: false,
      });

      window.on("close", (ev) => {
        if (this.isQuitting) return;
        ev.preventDefault();
        window.hide();
        void getSettings().save();
      });

      window.on("closed", () => {
        this.onboardingWindow = null;
        void getSettings().save();
      });

      this.onboardingWindow = window;

      void window.loadURL(`file://${resolve(DIST_ONBOARDING, "index.html")}`);
      return Result.ok(window);
    }, this);
  }

  private getCenteredPosition(width: number, height: number) {
    // const display = parent
    // ? screen.getDisplayMatching(parent.getBounds())
    // : screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
    const display = screen.getDisplayNearestPoint(
      screen.getCursorScreenPoint(),
    );
    const workArea = display.workArea;

    return Result.ok({
      x: Math.floor(workArea.x + (workArea.width - width) / 2),
      y: Math.floor(workArea.y + (workArea.height - height) / 2),
    });
  }

  /**
   * Create a window with standard configuration.
   *
   * @param options - The window options.
   */
  public createWindow(options: BrowserWindowConstructorOptions) {
    const { x, y } = Result.unwrap(
      this.getCenteredPosition(options.width!, options.height!),
    );
    const window = new BrowserWindow({
      x,
      y,
      title: BRAND,
      useContentSize: true,
      ...options,
    });

    applySecurityPolicy(window);

    if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });

    return Result.ok(window);
  }
}

export const windowsService = new WindowsService();
