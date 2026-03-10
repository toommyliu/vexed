import { join, resolve } from "path";
import { Result } from "better-result";
import {
  BrowserWindow,
  screen,
  type BrowserWindowConstructorOptions,
} from "electron";
import type { AccountWithScript, LogLevel, WindowIds } from "~/shared/types";
import { BRAND, DIST_PATH, IS_PACKAGED } from "../constants";
import { getSettings } from "../settings";
import { applySecurityPolicy } from "../util/applySecurityPolicy";
import { isWindowUsable } from "../util/browser-window";
import { environmentService } from "./environment";
import { createLogger } from "./logger";

const DIST_GAME = join(DIST_PATH, "game/");
const DIST_MANAGER = join(DIST_PATH, "manager/");
const DIST_ONBOARDING = join(DIST_PATH, "onboarding/"); // settings

const consoleLogger = createLogger("renderer:console"); // TODO: may rename the scope

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
    private readonly parentWindow: BrowserWindow,
    private readonly getWindow: () => BrowserWindow | null,
    private readonly openWindow: (
      config: SubwindowConfig,
    ) => Promise<BrowserWindow>,
  ) {}

  public get parent(): BrowserWindow {
    return this.parentWindow;
  }

  public close(): void {
    this.get()?.destroy();
  }

  public get(): BrowserWindow | null {
    return this.getWindow();
  }

  public async open(config: SubwindowConfig): Promise<BrowserWindow> {
    return this.openWindow(config);
  }
}

class WindowsService {
  // windowStore keys are game window IDs only.
  private readonly windowStore: WindowStore = new Map();

  // parentMap keys are subwindow IDs only; values point to game window IDs.
  private readonly parentMap: Map<number, number> = new Map();

  private managerWindow: BrowserWindow | null = null;

  private onboardingWindow: BrowserWindow | null = null;

  private lastFocusedGameWindowId: number | null = null;

  private _isQuitting = false;

  private getConsoleLogLevel(level: number): LogLevel {
    switch (level) {
      case 0:
        return "debug";
      case 1:
        return "info";
      case 2:
        return "warn";
      case 3:
        return "error";
      default:
        return "info";
    }
  }

  private shouldIgnoreConsoleMessage(level: number, sourceId: string): boolean {
    const source = sourceId.toLowerCase();
    // don't know
    if (
      source.startsWith("devtools://") ||
      source.startsWith("chrome-extension://")
    ) {
      return level !== 3;
    }

    return false;
  }

  private attachConsoleLogging(window: BrowserWindow): void {
    window.webContents.on(
      "console-message",
      (_event, level, message, _line, sourceId) => {
        if (this.shouldIgnoreConsoleMessage(level, sourceId)) return;
        const logLevel = this.getConsoleLogLevel(level);
        consoleLogger[logLevel](`[window:${window.id}] ${message}`);
      },
    );
  }

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

  private isWindowOpen(
    window: BrowserWindow | null | undefined,
  ): window is BrowserWindow {
    return Boolean(window && !window.isDestroyed());
  }

  private isUsableWindow(
    window: BrowserWindow | null | undefined,
  ): window is BrowserWindow {
    return Boolean(
      window && !window.isDestroyed() && !window.webContents.isDestroyed(),
    );
  }

  private showAndFocus(window: BrowserWindow): void {
    window.show();
    window.focus();
  }

  private resolveGameId(windowId: number): number | undefined {
    if (this.windowStore.has(windowId)) return windowId;
    return this.parentMap.get(windowId);
  }

  private registerGameWindow(window: BrowserWindow): number {
    const windowId = window.id;
    this.windowStore.set(windowId, {
      game: window,
      subwindows: new Map(),
    });
    return windowId;
  }

  private destroyTrackedSubwindows(entry: WindowStoreEntry): void {
    for (const subwindow of entry.subwindows.values()) {
      if (!subwindow || subwindow.isDestroyed()) continue;
      subwindow.destroy();
    }
  }

  private cleanupGameWindow(windowId: number): void {
    const entry = this.windowStore.get(windowId);
    if (!entry) return;
    this.destroyTrackedSubwindows(entry);
    this.windowStore.delete(windowId);
    environmentService.clearState(windowId);
  }

  private wireGameLifecycle(window: BrowserWindow, windowId: number): void {
    window.on("close", () => {
      if (!this.isUsableWindow(window)) return;
      this.cleanupGameWindow(windowId);
      if (this.lastFocusedGameWindowId === windowId) {
        this.lastFocusedGameWindowId = null;
      }
    });

    window.on("focus", () => {
      this.lastFocusedGameWindowId = windowId;
    });
  }

  private wireSubwindowLifecycle(
    gameWindowId: number,
    id: WindowIds,
    storeRef: WindowStoreEntry,
    window: BrowserWindow,
  ): void {
    this.registerSubwindow(gameWindowId, window.id);
    storeRef.subwindows.set(id, window);
    window.once("ready-to-show", () => {
      window.show();
    });
    window.on("close", (ev) => {
      ev.preventDefault();
      window.hide();
    });
    const subwindowId = window.id;
    window.on("closed", () => {
      this.unregisterSubwindow(subwindowId);
      storeRef.subwindows.delete(id);
    });
  }

  private wireManagerLifecycle(window: BrowserWindow): void {
    window.on("close", async (ev) => {
      if (this.isQuitting) return;
      ev.preventDefault();
      window.hide();
      await getSettings().save();
    });

    window.on("closed", async () => {
      this.managerWindow = null;
      await getSettings().save();
    });
  }

  private wireOnboardingLifecycle(window: BrowserWindow): void {
    window.on("close", async (ev) => {
      if (this.isQuitting) return;
      ev.preventDefault();
      window.hide();
      await getSettings().save();
    });

    window.on("closed", async () => {
      this.onboardingWindow = null;
      await getSettings().save();
    });
  }

  private buildGameAdditionalArgs(account: AccountWithScript | null): string[] {
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

    return args;
  }

  private async createSubwindow(
    gameWindowId: number,
    id: WindowIds,
    storeRef: WindowStoreEntry,
    config: SubwindowConfig,
  ): Promise<BrowserWindow> {
    const window = Result.unwrap(
      this.createWindow({
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
    this.wireSubwindowLifecycle(gameWindowId, id, storeRef, window);
    await window.loadFile(join(DIST_PATH, config.path));
    return window;
  }

  public getLastFocusedGameWindowId(): number | null {
    const value = this.lastFocusedGameWindowId;
    if (value === null) return null;
    const win = BrowserWindow.fromId(value);
    return isWindowUsable(win) ? value : null;
  }

  /**
   * Resolve any window ID to its parent game window.
   *
   * @param senderWindowId - The window ID to resolve from.
   */
  public resolveGameWindow(senderWindowId: number): BrowserWindow | null {
    const gameId = this.resolveGameId(senderWindowId);
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
    const getWindow = () => this.getSubwindow(gameWindowId, id);
    const openWindow = async (config: SubwindowConfig) => {
      const existing = getWindow();
      if (existing) {
        this.showAndFocus(existing);
        return existing;
      }

      return this.createSubwindow(gameWindowId, id, storeRef, config);
    };

    return new SubwindowHandleImpl(storeRef.game, getWindow, openWindow);
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
    return this.isWindowOpen(win) ? win : null;
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
    return this.resolveGameId(windowId);
  }

  /**
   * Iterate over all game windows with their IDs.
   */
  public async forEachGameWindow(
    fn: (
      gameWindowId: number,
      gameWindow: BrowserWindow,
    ) => Promise<void> | void,
  ): Promise<void> {
    for (const [gameWindowId, entry] of this.windowStore.entries()) {
      if (entry.game.isDestroyed()) continue;
      await fn(gameWindowId, entry.game);
    }
  }

  public game(account: AccountWithScript | null = null) {
    const args = this.buildGameAdditionalArgs(account);
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
      const windowId = this.registerGameWindow(window);
      this.wireGameLifecycle(window, windowId);
      void window.loadURL(`file://${resolve(DIST_GAME, "index.html")}`);
      return Result.ok(window);
    }, this);
  }

  public manager() {
    if (this.isWindowOpen(this.managerWindow)) {
      this.showAndFocus(this.managerWindow);
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
      this.wireManagerLifecycle(window);
      this.managerWindow = window;
      void window.loadURL(`file://${resolve(DIST_MANAGER, "index.html")}`);
      return Result.ok(window);
    }, this);
  }

  public getManagerWindow(): BrowserWindow | null {
    if (!this.isWindowOpen(this.managerWindow)) return null;
    return this.managerWindow;
  }

  public onboarding() {
    if (this.isWindowOpen(this.onboardingWindow)) {
      this.showAndFocus(this.onboardingWindow);
      return Result.ok(this.onboardingWindow);
    }

    return Result.gen(function* () {
      const window = yield* this.createWindow({
        width: 651,
        height: 654,
        webPreferences: {
          nodeIntegration: true,
        },
        // resizable: false,
        maximizable: false,
      });

      this.wireOnboardingLifecycle(window);
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
    this.attachConsoleLogging(window);
    applySecurityPolicy(window);
    if (!IS_PACKAGED) window.webContents.openDevTools({ mode: "right" });
    return Result.ok(window);
  }
}

export const windowsService = new WindowsService();
