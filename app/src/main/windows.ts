import {
  BrowserWindow,
  app,
  screen,
  type BrowserWindowConstructorOptions,
  type Event as ElectronEvent,
} from "electron";
import { join } from "path";
import { pathToFileURL } from "url";
import { Data, Effect, Layer, ServiceMap } from "effect";
import {
  getWindowDefinition,
  isAppWindowDefinition,
  isGameChildWindowDefinition,
  isWindowId,
  type WindowDefinition,
  type WindowId,
} from "../shared/windows";

export class WindowManagerError extends Data.TaggedError("WindowManagerError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface WindowManagerConfig {
  readonly gameWindowHtmlPath: string;
  readonly isDev: boolean;
  readonly preloadPath: string;
  readonly rendererUrl: string | null;
  readonly windowHtmlPath: (id: WindowId) => string;
  readonly onGameWindowCreated?: (window: BrowserWindow) => void;
}

export interface WindowServiceShape {
  readonly openGameWindow: Effect.Effect<BrowserWindow, WindowManagerError>;
  readonly openWindow: (
    id: WindowId,
    senderWindowId?: number,
  ) => Effect.Effect<BrowserWindow, WindowManagerError>;
  readonly revealGameWindow: Effect.Effect<void, WindowManagerError>;
  readonly getGameWindowId: (
    windowId: number,
  ) => Effect.Effect<number | undefined>;
  readonly setQuitting: (quitting: boolean) => Effect.Effect<void>;
}

export class WindowService extends ServiceMap.Service<
  WindowService,
  WindowServiceShape
>()("main/WindowService") {}

export type WindowEffectRunner = <A>(
  effect: Effect.Effect<A, WindowManagerError, WindowService>,
) => Promise<A>;

export interface ElectronWindowRuntime {
  readonly platform: NodeJS.Platform;
  readonly createWindow: (
    options: BrowserWindowConstructorOptions,
  ) => BrowserWindow;
  readonly fromId: (id: number) => BrowserWindow | null;
  readonly getAllWindows: () => BrowserWindow[];
  readonly getFocusedWindow: () => BrowserWindow | null;
  readonly getCenteredPosition: (
    width: number,
    height: number,
  ) => { readonly x: number; readonly y: number };
  readonly focusApp: () => void;
}

interface GameWindowEntry {
  readonly gameWindow: BrowserWindow;
  readonly childWindows: Map<WindowId, BrowserWindow>;
}

export type RevealSubscription = (listener: () => void) => void;

export const bindFirstRevealTrigger = (
  subscribers: readonly RevealSubscription[],
  reveal: () => void,
): void => {
  let revealed = false;
  const fire = () => {
    if (revealed) {
      return;
    }

    revealed = true;
    reveal();
  };

  for (const subscribe of subscribers) {
    subscribe(fire);
  }
};

export const revealWindow = (
  runtime: Pick<ElectronWindowRuntime, "focusApp" | "platform">,
  window: BrowserWindow,
): void => {
  if (window.isDestroyed()) {
    return;
  }

  if (window.isMinimized()) {
    window.restore();
  }

  if (!window.isVisible()) {
    window.show();
  }

  if (runtime.platform === "darwin") {
    runtime.focusApp();
  }

  window.focus();
};

const isWindowOpen = (
  window: BrowserWindow | null | undefined,
): window is BrowserWindow => Boolean(window && !window.isDestroyed());

const isWindowUsable = (
  window: BrowserWindow | null | undefined,
): window is BrowserWindow =>
  Boolean(window && !window.isDestroyed() && !window.webContents.isDestroyed());

const createLoadFailure = (
  target: string,
  kind: "file" | "url",
  cause: unknown,
) =>
  new WindowManagerError({
    message: `Failed to load ${kind} target: ${target}`,
    cause,
  });

const loadWindow = (
  window: BrowserWindow,
  target: string,
  kind: "file" | "url",
) =>
  Effect.tryPromise({
    try: () =>
      kind === "url" ? window.loadURL(target) : window.loadFile(target),
    catch: (cause) => createLoadFailure(target, kind, cause),
  });

const getWindowDimensions = (definition: WindowDefinition) =>
  definition.dimensions;

const createWebPreferences = (
  config: WindowManagerConfig,
  options?: { readonly plugins?: boolean },
): NonNullable<BrowserWindowConstructorOptions["webPreferences"]> => ({
  preload: config.preloadPath,
  nodeIntegration: false,
  contextIsolation: true,
  ...(options?.plugins ? { plugins: true } : {}),
});

const createGameWindowOptions = (
  config: WindowManagerConfig,
): BrowserWindowConstructorOptions => ({
  backgroundColor: "#0e0e0f",
  width: 1024,
  height: 768,
  show: false,
  webPreferences: createWebPreferences(config, { plugins: true }),
});

const createCatalogWindowOptions = (
  config: WindowManagerConfig,
  definition: WindowDefinition,
  parent?: BrowserWindow,
): BrowserWindowConstructorOptions => {
  const dimensions = getWindowDimensions(definition);
  const options: BrowserWindowConstructorOptions = {
    backgroundColor: "#0e0e0f",
    title: definition.label,
    width: dimensions.width,
    height: dimensions.height,
    show: false,
    webPreferences: createWebPreferences(config),
  };

  if (parent) {
    options.parent = parent;
  }

  if (typeof dimensions.minWidth === "number") {
    options.minWidth = dimensions.minWidth;
  }

  if (typeof dimensions.minHeight === "number") {
    options.minHeight = dimensions.minHeight;
  }

  return options;
};

export const makeElectronWindowRuntime = (): ElectronWindowRuntime => ({
  platform: process.platform,
  createWindow: (options) => new BrowserWindow(options),
  fromId: (id) => BrowserWindow.fromId(id),
  getAllWindows: () => BrowserWindow.getAllWindows(),
  getFocusedWindow: () => BrowserWindow.getFocusedWindow(),
  getCenteredPosition: (width, height) => {
    const display = screen.getDisplayNearestPoint(
      screen.getCursorScreenPoint(),
    );
    const workArea = display.workArea;
    return {
      x: Math.floor(workArea.x + (workArea.width - width) / 2),
      y: Math.floor(workArea.y + (workArea.height - height) / 2),
    };
  },
  focusApp: () => app.focus({ steal: true }),
});

export const makeWindowService = (
  config: WindowManagerConfig,
  runtime: ElectronWindowRuntime,
): WindowServiceShape => {
  const gameWindows = new Map<number, GameWindowEntry>();
  const parentGameWindowIds = new Map<number, number>();
  const appWindows = new Map<WindowId, BrowserWindow>();
  const forceClosingWindowIds = new Set<number>();
  let isQuitting = false;
  // Keep track of the last game window id to focus the
  // Command Palette on the correct window when opened from a non-game window.
  let lastFocusedGameWindowId: number | null = null;

  const getGameWindowIdSync = (windowId: number): number | undefined => {
    if (gameWindows.has(windowId)) {
      return windowId;
    }

    return parentGameWindowIds.get(windowId);
  };

  const createManagedWindow = (
    options: BrowserWindowConstructorOptions,
  ): Effect.Effect<BrowserWindow, WindowManagerError> =>
    Effect.try({
      try: () => {
        const position =
          typeof options.width === "number" &&
          typeof options.height === "number"
            ? runtime.getCenteredPosition(options.width, options.height)
            : {};

        const window = runtime.createWindow({
          ...position,
          useContentSize: true,
          ...options,
        });

        const webContents = window.webContents as typeof window.webContents & {
          setWindowOpenHandler?: (
            handler: () => { readonly action: "deny" },
          ) => void;
        };

        if (typeof webContents.setWindowOpenHandler === "function") {
          webContents.setWindowOpenHandler(() => ({ action: "deny" }));
        } else {
          window.webContents.on("new-window", (event: ElectronEvent) => {
            event.preventDefault();
          });
        }

        if (config.isDev) {
          window.webContents.openDevTools({ mode: "right" });
        }

        return window;
      },
      catch: (cause) =>
        new WindowManagerError({
          message: "Failed to create browser window",
          cause,
        }),
    });

  const revealWhenReady = (window: BrowserWindow): void => {
    const subscribers: RevealSubscription[] = [
      (fire) => window.once("ready-to-show", fire),
    ];

    if (runtime.platform === "linux") {
      subscribers.push((fire) =>
        window.webContents.once("did-finish-load", fire),
      );
    }

    bindFirstRevealTrigger(subscribers, () => revealWindow(runtime, window));
  };

  const showAndFocus = (window: BrowserWindow): void => {
    revealWindow(runtime, window);
  };

  const cleanupDestroyedChild = (
    gameWindowId: number,
    definitionId: WindowId,
    childWindowId: number,
  ): void => {
    gameWindows.get(gameWindowId)?.childWindows.delete(definitionId);
    parentGameWindowIds.delete(childWindowId);
    forceClosingWindowIds.delete(childWindowId);
  };

  const destroyWindow = (window: BrowserWindow): void => {
    if (!window.isDestroyed()) {
      window.destroy();
    }
  };

  const destroyChildWindows = (entry: GameWindowEntry): void => {
    for (const childWindow of entry.childWindows.values()) {
      if (childWindow.isDestroyed()) {
        continue;
      }

      forceClosingWindowIds.add(childWindow.id);
      childWindow.destroy();
    }

    entry.childWindows.clear();
  };

  const registerGameWindow = (window: BrowserWindow): void => {
    const gameWindowId = window.id;
    const entry: GameWindowEntry = {
      gameWindow: window,
      childWindows: new Map(),
    };

    gameWindows.set(gameWindowId, entry);
    lastFocusedGameWindowId = gameWindowId;

    window.on("focus", () => {
      lastFocusedGameWindowId = gameWindowId;
    });

    window.on("close", () => {
      destroyChildWindows(entry);
    });

    window.on("closed", () => {
      destroyChildWindows(entry);
      gameWindows.delete(gameWindowId);
      if (lastFocusedGameWindowId === gameWindowId) {
        lastFocusedGameWindowId = null;
      }
    });
  };

  const unregisterGameWindow = (window: BrowserWindow): void => {
    const entry = gameWindows.get(window.id);
    if (entry) {
      destroyChildWindows(entry);
    }

    gameWindows.delete(window.id);
    if (lastFocusedGameWindowId === window.id) {
      lastFocusedGameWindowId = null;
    }
  };

  const getLastFocusedGameWindowId = (): number | null => {
    if (lastFocusedGameWindowId === null) {
      return null;
    }

    const window = runtime.fromId(lastFocusedGameWindowId);
    return isWindowUsable(window) ? lastFocusedGameWindowId : null;
  };

  const firstGameWindowId = (): number | undefined => {
    for (const [id, entry] of gameWindows) {
      if (isWindowUsable(entry.gameWindow)) {
        return id;
      }
    }

    return undefined;
  };

  const resolveGameWindow = (senderWindowId?: number): BrowserWindow | null => {
    const senderGameWindowId =
      senderWindowId === undefined
        ? undefined
        : getGameWindowIdSync(senderWindowId);

    const candidates = [
      senderGameWindowId,
      getLastFocusedGameWindowId(),
      firstGameWindowId(),
    ];

    for (const candidate of candidates) {
      if (candidate === undefined || candidate === null) {
        continue;
      }

      const window = gameWindows.get(candidate)?.gameWindow;
      if (isWindowUsable(window)) {
        return window;
      }
    }

    return null;
  };

  const requireWindowDefinition = (
    id: WindowId,
  ): Effect.Effect<WindowDefinition, WindowManagerError> => {
    if (!isWindowId(id)) {
      return Effect.fail(
        new WindowManagerError({
          message: `Unknown window: ${String(id)}`,
        }),
      );
    }

    const definition = getWindowDefinition(id);
    if (!definition) {
      return Effect.fail(
        new WindowManagerError({
          message: `Missing window definition: ${id}`,
        }),
      );
    }

    return Effect.succeed(definition);
  };

  const loadGameRenderer = (
    window: BrowserWindow,
  ): Effect.Effect<void, WindowManagerError> =>
    config.rendererUrl
      ? loadWindow(window, config.rendererUrl, "url")
      : loadWindow(window, config.gameWindowHtmlPath, "file");

  const loadCatalogRenderer = (
    window: BrowserWindow,
    definition: WindowDefinition,
  ): Effect.Effect<void, WindowManagerError> => {
    const url = pathToFileURL(config.windowHtmlPath(definition.id));
    return loadWindow(window, url.toString(), "url");
  };

  const openGameWindow: WindowServiceShape["openGameWindow"] = Effect.gen(
    function* () {
      const window = yield* createManagedWindow(
        createGameWindowOptions(config),
      );

      config.onGameWindowCreated?.(window);
      registerGameWindow(window);
      revealWhenReady(window);

      yield* loadGameRenderer(window).pipe(
        Effect.catch((error: WindowManagerError) =>
          Effect.sync(() => {
            unregisterGameWindow(window);
            destroyWindow(window);
          }).pipe(Effect.flatMap(() => Effect.fail(error))),
        ),
      );

      return window;
    },
  );

  const resolveOrCreateGameWindow = (
    senderWindowId?: number,
  ): Effect.Effect<BrowserWindow, WindowManagerError> => {
    const resolvedGameWindow = resolveGameWindow(senderWindowId);
    if (resolvedGameWindow) {
      return Effect.succeed(resolvedGameWindow);
    }

    return openGameWindow;
  };

  const openGameChildWindow = (
    gameWindowId: number,
    definition: WindowDefinition,
  ): Effect.Effect<BrowserWindow, WindowManagerError> =>
    Effect.gen(function* () {
      const entry = gameWindows.get(gameWindowId);
      if (!entry || !isWindowUsable(entry.gameWindow)) {
        return yield* new WindowManagerError({
          message: "Game window is no longer usable",
        });
      }

      const existing = entry.childWindows.get(definition.id);
      if (isWindowOpen(existing)) {
        showAndFocus(existing);
        return existing;
      }

      const childWindow = yield* createManagedWindow(
        createCatalogWindowOptions(config, definition, entry.gameWindow),
      );
      const childWindowId = childWindow.id;

      entry.childWindows.set(definition.id, childWindow);
      parentGameWindowIds.set(childWindowId, gameWindowId);
      revealWhenReady(childWindow);

      childWindow.on("close", (event: ElectronEvent) => {
        if (isQuitting || forceClosingWindowIds.has(childWindowId)) {
          return;
        }

        if (definition.closeBehavior === "hide") {
          event.preventDefault();
          childWindow.hide();
        }
      });

      childWindow.on("closed", () => {
        cleanupDestroyedChild(gameWindowId, definition.id, childWindowId);
      });

      yield* loadCatalogRenderer(childWindow, definition).pipe(
        Effect.catch((error: WindowManagerError) =>
          Effect.sync(() => {
            cleanupDestroyedChild(gameWindowId, definition.id, childWindowId);
            destroyWindow(childWindow);
          }).pipe(Effect.flatMap(() => Effect.fail(error))),
        ),
      );

      return childWindow;
    });

  const openAppWindow = (
    definition: WindowDefinition,
  ): Effect.Effect<BrowserWindow, WindowManagerError> =>
    Effect.gen(function* () {
      const existing = appWindows.get(definition.id);
      if (isWindowOpen(existing)) {
        showAndFocus(existing);
        return existing;
      }

      const appWindow = yield* createManagedWindow(
        createCatalogWindowOptions(config, definition),
      );

      appWindows.set(definition.id, appWindow);
      revealWhenReady(appWindow);

      appWindow.on("close", (event: ElectronEvent) => {
        if (isQuitting) {
          return;
        }

        if (definition.closeBehavior === "hide") {
          event.preventDefault();
          appWindow.hide();
        }
      });

      appWindow.on("closed", () => {
        const current = appWindows.get(definition.id);
        if (current === appWindow) {
          appWindows.delete(definition.id);
        }
      });

      yield* loadCatalogRenderer(appWindow, definition).pipe(
        Effect.catch((error: WindowManagerError) =>
          Effect.sync(() => {
            appWindows.delete(definition.id);
            destroyWindow(appWindow);
          }).pipe(Effect.flatMap(() => Effect.fail(error))),
        ),
      );

      return appWindow;
    });

  const openWindow: WindowServiceShape["openWindow"] = (id, senderWindowId) =>
    Effect.gen(function* () {
      const definition = yield* requireWindowDefinition(id);

      if (isAppWindowDefinition(definition)) {
        return yield* openAppWindow(definition);
      }

      if (isGameChildWindowDefinition(definition)) {
        const gameWindow = yield* resolveOrCreateGameWindow(senderWindowId);
        return yield* openGameChildWindow(gameWindow.id, definition);
      }

      return yield* new WindowManagerError({
        message: `Unsupported window scope: ${definition.scope}`,
      });
    });

  const revealGameWindow: WindowServiceShape["revealGameWindow"] = Effect.gen(
    function* () {
      const gameWindow = resolveGameWindow();
      if (gameWindow) {
        revealWindow(runtime, gameWindow);
        return;
      }

      yield* openGameWindow;
    },
  ).pipe(Effect.asVoid);

  return {
    openGameWindow,
    openWindow,
    revealGameWindow,
    getGameWindowId: (windowId) =>
      Effect.succeed(getGameWindowIdSync(windowId)),
    setQuitting: (quitting) =>
      Effect.sync(() => {
        isQuitting = quitting;
      }),
  };
};

export const WindowServiceLive = (
  config: WindowManagerConfig,
  runtime: ElectronWindowRuntime = makeElectronWindowRuntime(),
) => Layer.succeed(WindowService, makeWindowService(config, runtime));

export const getRendererWindowPath = (
  distRendererPath: string,
  id: WindowId,
): string => join(distRendererPath, id, "index.html");

export const getRendererGameWindowPath = (distRendererPath: string): string =>
  join(distRendererPath, "game", "index.html");
