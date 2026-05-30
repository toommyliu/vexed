import { EventEmitter } from "node:events";
import type { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  createAppearanceSnapshot,
  serializeAppearanceSnapshotArgument,
  type AppearanceSnapshot,
} from "../../shared/appearance-snapshot";
import { DEFAULT_APPEARANCE } from "../../shared/settings";
import { WindowIds, type WindowId } from "../../shared/windows";
import {
  WindowManagerError,
  bindFirstRevealTrigger,
  makeWindowService,
  type ElectronWindowRuntime,
  type WindowManagerConfig,
} from "./WindowService";

class FakeWebContents extends EventEmitter {
  public destroyed = false;
  public openedDevTools = false;
  public windowOpenHandler:
    | (() => { readonly action: "allow" | "deny" })
    | undefined;

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public openDevTools(): void {
    this.openedDevTools = true;
  }

  public setWindowOpenHandler(
    handler: () => { readonly action: "allow" | "deny" },
  ): void {
    this.windowOpenHandler = handler;
  }
}

class FakeWindow extends EventEmitter {
  public destroyed = false;
  public visible = false;
  public minimized = false;
  public focused = false;
  public hidden = false;
  public readonly webContents = new FakeWebContents();
  public failLoad = false;
  public closeCalls = 0;

  public constructor(
    public readonly id: number,
    public readonly options: BrowserWindowConstructorOptions,
  ) {
    super();
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isMinimized(): boolean {
    return this.minimized;
  }

  public restore(): void {
    this.minimized = false;
  }

  public show(): void {
    this.visible = true;
    this.hidden = false;
  }

  public hide(): void {
    this.visible = false;
    this.hidden = true;
  }

  public focus(): void {
    this.focused = true;
    this.emit("focus");
  }

  public blur(): void {
    this.focused = false;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.webContents.destroyed = true;
    this.emit("closed");
  }

  public close(): boolean {
    this.closeCalls += 1;
    let prevented = false;
    this.emit("close", {
      preventDefault() {
        prevented = true;
      },
    });

    if (!prevented) {
      this.destroy();
    }

    return prevented;
  }

  public async loadURL(): Promise<void> {
    if (this.failLoad) {
      throw new Error("load failed");
    }

    this.webContents.emit("did-finish-load");
  }

  public async loadFile(): Promise<void> {
    if (this.failLoad) {
      throw new Error("load failed");
    }

    this.webContents.emit("did-finish-load");
  }
}

interface Harness {
  readonly runtime: ElectronWindowRuntime;
  readonly service: ReturnType<typeof makeWindowService>;
  readonly windows: FakeWindow[];
  failNextLoad(): void;
}

const createHarness = (
  platform: NodeJS.Platform = "darwin",
  appearanceSnapshot: AppearanceSnapshot = createAppearanceSnapshot(
    DEFAULT_APPEARANCE,
    true,
  ),
): Harness => {
  const windows: FakeWindow[] = [];
  let nextId = 1;
  let focusedWindow: FakeWindow | null = null;
  let failNextLoad = false;

  const runtime: ElectronWindowRuntime = {
    platform,
    createWindow: (options) => {
      const win = new FakeWindow(nextId++, options);
      win.failLoad = failNextLoad;
      failNextLoad = false;
      windows.push(win);
      win.on("focus", () => {
        focusedWindow = win;
      });
      return win as unknown as BrowserWindow;
    },
    fromId: (id) =>
      (windows.find((window) => window.id === id) ??
        null) as unknown as BrowserWindow | null,
    getAllWindows: () => windows as unknown as BrowserWindow[],
    getFocusedWindow: () => focusedWindow as unknown as BrowserWindow | null,
    getCenteredPosition: () => ({ x: 10, y: 20 }),
    focusApp: () => {},
  };

  const config: WindowManagerConfig = {
    gameWindowHtmlPath: "/renderer/game/index.html",
    isDev: false,
    preloadPath: "/preload/index.js",
    rendererUrl: null,
    windowHtmlPath: (id: WindowId) => `/renderer/${id}/index.html`,
    getAppearanceSnapshot: () => appearanceSnapshot,
  };

  return {
    runtime,
    service: makeWindowService(config, runtime),
    windows,
    failNextLoad() {
      failNextLoad = true;
    },
  };
};

const run = <A>(effect: Effect.Effect<A, WindowManagerError>) =>
  Effect.runPromise(effect);

const waitForScheduledClose = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

describe("window reveal", () => {
  it("reveals when the first trigger fires", () => {
    const window = new EventEmitter();
    const revealCalls: string[] = [];

    bindFirstRevealTrigger([(fire) => window.once("ready-to-show", fire)], () =>
      revealCalls.push("revealed"),
    );

    window.emit("ready-to-show");

    expect(revealCalls).toEqual(["revealed"]);
  });

  it("reveals when only the fallback trigger fires", () => {
    const webContents = new EventEmitter();
    const revealCalls: string[] = [];

    bindFirstRevealTrigger(
      [(fire) => webContents.once("did-finish-load", fire)],
      () => revealCalls.push("revealed"),
    );

    webContents.emit("did-finish-load");

    expect(revealCalls).toEqual(["revealed"]);
  });

  it("reveals only once", () => {
    const window = new EventEmitter();
    const webContents = new EventEmitter();
    const revealCalls: string[] = [];

    bindFirstRevealTrigger(
      [
        (fire) => window.once("ready-to-show", fire),
        (fire) => webContents.once("did-finish-load", fire),
      ],
      () => revealCalls.push("revealed"),
    );

    webContents.emit("did-finish-load");
    window.emit("ready-to-show");

    expect(revealCalls).toEqual(["revealed"]);
  });
});

describe("window service", () => {
  it("creates game windows with the pre-paint appearance snapshot", async () => {
    const snapshot = createAppearanceSnapshot(
      { ...DEFAULT_APPEARANCE, themeMode: "light" },
      false,
    );
    const harness = createHarness("darwin", snapshot);

    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    expect(gameWindow.options.backgroundColor).toBe(snapshot.backgroundColor);
    expect(gameWindow.options.webPreferences?.additionalArguments).toEqual([
      serializeAppearanceSnapshotArgument(snapshot),
    ]);
  });

  it("denies renderer-created windows through the Electron 11 new-window event", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const event = {
      prevented: false,
      preventDefault() {
        this.prevented = true;
      },
    };

    gameWindow.webContents.emit("new-window", event);

    expect(event.prevented).toBe(true);
  });

  it("denies renderer-created windows through the modern window-open handler", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    expect(gameWindow.webContents.windowOpenHandler?.()).toEqual({
      action: "deny",
    });
  });

  it("creates catalog windows with the pre-paint appearance snapshot", async () => {
    const snapshot = createAppearanceSnapshot(
      { ...DEFAULT_APPEARANCE, themeMode: "light" },
      false,
    );
    const harness = createHarness("darwin", snapshot);

    const settingsWindow = (await run(
      harness.service.openWindow(WindowIds.Settings),
    )) as unknown as FakeWindow;

    expect(settingsWindow.options.backgroundColor).toBe(
      snapshot.backgroundColor,
    );
    expect(settingsWindow.options.webPreferences?.additionalArguments).toEqual([
      serializeAppearanceSnapshotArgument(snapshot),
    ]);
  });

  it("reuses app windows and hides them on close", async () => {
    const harness = createHarness();

    const first = (await run(
      harness.service.openWindow(WindowIds.Settings),
    )) as unknown as FakeWindow;
    first.emit("ready-to-show");

    expect(first.visible).toBe(true);
    expect(first.close()).toBe(true);
    expect(first.hidden).toBe(true);

    const second = await run(harness.service.openWindow(WindowIds.Settings));

    expect(second).toBe(first);
    expect(first.visible).toBe(true);
    expect(first.focused).toBe(true);
    expect(harness.windows).toHaveLength(1);
  });

  it("tracks Environment and other game-child windows against the resolved game", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const packets = (await run(
      harness.service.openWindow(WindowIds.Packets, gameWindow.id),
    )) as unknown as FakeWindow;

    expect(environment.options.parent).toBeUndefined();
    expect(packets.options.parent).toBeUndefined();
    await expect(
      run(harness.service.getGameWindowId(environment.id)),
    ).resolves.toBe(gameWindow.id);
    await expect(
      run(harness.service.getGameWindowId(packets.id)),
    ).resolves.toBe(gameWindow.id);
  });

  it("resolves child senders back to their owning game", async () => {
    const harness = createHarness();
    const firstGame = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const secondGame = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    secondGame.focus();

    const follower = (await run(
      harness.service.openWindow(WindowIds.Follower, firstGame.id),
    )) as unknown as FakeWindow;
    const packets = (await run(
      harness.service.openWindow(WindowIds.Packets, follower.id),
    )) as unknown as FakeWindow;

    expect(packets.options.parent).toBeUndefined();
    await expect(
      run(harness.service.getGameWindowId(packets.id)),
    ).resolves.toBe(firstGame.id);
    await expect(
      run(harness.service.getGameWindowId(packets.id)),
    ).resolves.not.toBe(secondGame.id);
  });

  it("reveals an existing game window instead of creating another one", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    gameWindow.emit("ready-to-show");
    gameWindow.hide();
    gameWindow.minimized = true;
    gameWindow.focused = false;

    await run(harness.service.revealGameWindow());

    expect(gameWindow.visible).toBe(true);
    expect(gameWindow.minimized).toBe(false);
    expect(gameWindow.focused).toBe(true);
    expect(harness.windows).toHaveLength(1);
  });

  it("reveals a hidden account manager window for app activation", async () => {
    const harness = createHarness();
    const accountManager = (await run(
      harness.service.openWindow(WindowIds.AccountManager),
    )) as unknown as FakeWindow;
    accountManager.emit("ready-to-show");

    expect(accountManager.close()).toBe(true);
    accountManager.blur();

    await run(harness.service.revealWindowForAppActivation());

    expect(accountManager.visible).toBe(true);
    expect(accountManager.focused).toBe(true);
    expect(harness.windows).toHaveLength(1);
  });

  it("does not restore settings as the primary app activation window", async () => {
    const harness = createHarness();
    const accountManager = (await run(
      harness.service.openWindow(WindowIds.AccountManager),
    )) as unknown as FakeWindow;
    const settings = (await run(
      harness.service.openWindow(WindowIds.Settings),
    )) as unknown as FakeWindow;
    accountManager.emit("ready-to-show");
    settings.emit("ready-to-show");

    expect(accountManager.close()).toBe(true);
    expect(settings.close()).toBe(true);
    accountManager.blur();
    settings.blur();

    await run(harness.service.revealWindowForAppActivation());

    expect(accountManager.visible).toBe(true);
    expect(accountManager.focused).toBe(true);
    expect(settings.visible).toBe(false);
  });

  it("does nothing for app activation while a primary window is presented", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const accountManager = (await run(
      harness.service.openWindow(WindowIds.AccountManager),
    )) as unknown as FakeWindow;
    gameWindow.emit("ready-to-show");
    accountManager.emit("ready-to-show");
    expect(accountManager.close()).toBe(true);
    accountManager.blur();
    gameWindow.blur();

    await run(harness.service.revealWindowForAppActivation());

    expect(gameWindow.visible).toBe(true);
    expect(gameWindow.focused).toBe(false);
    expect(accountManager.visible).toBe(false);
  });

  it("restores a minimized last-focused game window for app activation", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    gameWindow.emit("ready-to-show");
    gameWindow.minimized = true;
    gameWindow.blur();

    await run(harness.service.revealWindowForAppActivation());

    expect(gameWindow.visible).toBe(true);
    expect(gameWindow.minimized).toBe(false);
    expect(gameWindow.focused).toBe(true);
    expect(harness.windows).toHaveLength(1);
  });

  it("creates a game window for app activation when no primary window exists", async () => {
    const harness = createHarness();

    await run(harness.service.revealWindowForAppActivation());

    expect(harness.windows).toHaveLength(1);
    expect(harness.windows[0]?.options.webPreferences?.plugins).toBe(true);
  });

  it("ignores unusable primary windows during app activation", async () => {
    const harness = createHarness();
    const accountManager = (await run(
      harness.service.openWindow(WindowIds.AccountManager),
    )) as unknown as FakeWindow;
    accountManager.emit("ready-to-show");
    accountManager.webContents.destroyed = true;
    accountManager.hide();
    accountManager.blur();

    await run(harness.service.revealWindowForAppActivation());

    expect(accountManager.visible).toBe(false);
    expect(harness.windows).toHaveLength(2);
    expect(harness.windows[1]?.options.webPreferences?.plugins).toBe(true);
  });

  it("ignores destroyed primary windows during app activation", async () => {
    const harness = createHarness();
    const accountManager = (await run(
      harness.service.openWindow(WindowIds.AccountManager),
    )) as unknown as FakeWindow;
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    accountManager.emit("ready-to-show");
    gameWindow.emit("ready-to-show");
    expect(accountManager.close()).toBe(true);
    accountManager.blur();
    gameWindow.destroy();

    await run(harness.service.revealWindowForAppActivation());

    expect(accountManager.visible).toBe(true);
    expect(accountManager.focused).toBe(true);
  });

  it("destroys game children when their owning game window closes", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const packets = (await run(
      harness.service.openWindow(WindowIds.Packets, gameWindow.id),
    )) as unknown as FakeWindow;

    expect(gameWindow.close()).toBe(false);

    expect(environment.destroyed).toBe(true);
    expect(packets.destroyed).toBe(true);
  });

  it("requests tracked game windows to close asynchronously", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    await run(harness.service.requestCloseGameWindow(gameWindow.id));

    expect(gameWindow.destroyed).toBe(false);

    await waitForScheduledClose();

    expect(gameWindow.closeCalls).toBe(1);
    expect(gameWindow.destroyed).toBe(true);
  });

  it("ignores missing or destroyed game windows when close is requested", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    gameWindow.destroy();

    await run(harness.service.requestCloseGameWindow(gameWindow.id));
    await run(harness.service.requestCloseGameWindow(9999));
    await waitForScheduledClose();

    expect(gameWindow.closeCalls).toBe(0);
  });

  it("cleans up child windows when a requested game window close runs", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const packets = (await run(
      harness.service.openWindow(WindowIds.Packets, gameWindow.id),
    )) as unknown as FakeWindow;

    await run(harness.service.requestCloseGameWindow(gameWindow.id));
    await waitForScheduledClose();

    expect(environment.destroyed).toBe(true);
    expect(packets.destroyed).toBe(true);
  });

  it("destroys game children when their owning game window is destroyed", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const packets = (await run(
      harness.service.openWindow(WindowIds.Packets, gameWindow.id),
    )) as unknown as FakeWindow;

    gameWindow.destroy();

    expect(environment.destroyed).toBe(true);
    expect(packets.destroyed).toBe(true);
  });

  it("lets hidden-on-close children close while quitting", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    const child = (await run(
      harness.service.openWindow(WindowIds.FastTravels, gameWindow.id),
    )) as unknown as FakeWindow;

    expect(child.close()).toBe(true);
    expect(child.destroyed).toBe(false);

    await run(harness.service.setQuitting(true));

    expect(child.close()).toBe(false);
    expect(child.destroyed).toBe(true);
  });

  it("lets hidden-on-close app windows close while quitting", async () => {
    const harness = createHarness();
    const settings = (await run(
      harness.service.openWindow(WindowIds.Settings),
    )) as unknown as FakeWindow;

    expect(settings.close()).toBe(true);
    expect(settings.destroyed).toBe(false);

    await run(harness.service.setQuitting(true));

    expect(settings.close()).toBe(false);
    expect(settings.destroyed).toBe(true);
  });

  it("destroys and unregisters windows when renderer loading fails", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    harness.failNextLoad();

    await expect(
      run(harness.service.openWindow(WindowIds.LoaderGrabber, gameWindow.id)),
    ).rejects.toBeInstanceOf(WindowManagerError);

    const failedChild = harness.windows.at(-1);
    expect(failedChild?.destroyed).toBe(true);

    const nextChild = (await run(
      harness.service.openWindow(WindowIds.LoaderGrabber, gameWindow.id),
    )) as unknown as FakeWindow;

    expect(nextChild).not.toBe(failedChild);
    expect(nextChild.destroyed).toBe(false);
  });

  it("ignores destroyed game windows during owner resolution", async () => {
    const harness = createHarness();
    const destroyedGame = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;
    destroyedGame.destroy();

    const child = (await run(
      harness.service.openWindow(WindowIds.Environment),
    )) as unknown as FakeWindow;

    expect(child.options.parent).toBeUndefined();
    await expect(
      run(harness.service.getGameWindowId(child.id)),
    ).resolves.not.toBe(destroyedGame.id);
    expect(harness.windows.filter((window) => !window.destroyed)).toHaveLength(
      2,
    );
  });

  it("returns typed errors for unknown window ids", async () => {
    const harness = createHarness();

    await expect(
      run(harness.service.openWindow("missing-window" as WindowId)),
    ).rejects.toBeInstanceOf(WindowManagerError);
  });

  it("reveals Linux windows after renderer load when ready-to-show is unavailable", async () => {
    const harness = createHarness("linux");

    const gameWindow = (await run(
      harness.service.openGameWindow(),
    )) as unknown as FakeWindow;

    expect(gameWindow.visible).toBe(true);
  });
});
