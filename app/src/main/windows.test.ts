import { EventEmitter } from "node:events";
import type { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { WindowIds, type WindowId } from "../shared/windows";
import {
  WindowManagerError,
  bindFirstRevealTrigger,
  makeWindowService,
  type ElectronWindowRuntime,
  type WindowManagerConfig,
} from "./windows";

class FakeWebContents extends EventEmitter {
  public destroyed = false;
  public openedDevTools = false;
  public windowOpenHandler: (() => { readonly action: "deny" }) | null = null;

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public setWindowOpenHandler(
    handler: () => { readonly action: "deny" },
  ): void {
    this.windowOpenHandler = handler;
  }

  public openDevTools(): void {
    this.openedDevTools = true;
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

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.webContents.destroyed = true;
    this.emit("closed");
  }

  public close(): boolean {
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

const createHarness = (platform: NodeJS.Platform = "darwin"): Harness => {
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

  it("attaches Environment and other game-child windows to the resolved game", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;

    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const logger = (await run(
      harness.service.openWindow(WindowIds.PacketLogger, gameWindow.id),
    )) as unknown as FakeWindow;

    expect(environment.options.parent).toBe(gameWindow);
    expect(logger.options.parent).toBe(gameWindow);
  });

  it("resolves child senders back to their owning game", async () => {
    const harness = createHarness();
    const firstGame = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;
    const secondGame = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;
    secondGame.focus();

    const follower = (await run(
      harness.service.openWindow(WindowIds.Follower, firstGame.id),
    )) as unknown as FakeWindow;
    const packetSpammer = (await run(
      harness.service.openWindow(WindowIds.PacketSpammer, follower.id),
    )) as unknown as FakeWindow;

    expect(packetSpammer.options.parent).toBe(firstGame);
    expect(packetSpammer.options.parent).not.toBe(secondGame);
  });

  it("reveals an existing game window instead of creating another one", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;

    gameWindow.emit("ready-to-show");
    gameWindow.hide();
    gameWindow.minimized = true;
    gameWindow.focused = false;

    await run(harness.service.revealGameWindow);

    expect(gameWindow.visible).toBe(true);
    expect(gameWindow.minimized).toBe(false);
    expect(gameWindow.focused).toBe(true);
    expect(harness.windows).toHaveLength(1);
  });

  it("destroys game children when their owning game window closes", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;
    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const logger = (await run(
      harness.service.openWindow(WindowIds.PacketLogger, gameWindow.id),
    )) as unknown as FakeWindow;

    expect(gameWindow.close()).toBe(false);

    expect(environment.destroyed).toBe(true);
    expect(logger.destroyed).toBe(true);
  });

  it("destroys game children when their owning game window is destroyed", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;
    const environment = (await run(
      harness.service.openWindow(WindowIds.Environment, gameWindow.id),
    )) as unknown as FakeWindow;
    const logger = (await run(
      harness.service.openWindow(WindowIds.PacketLogger, gameWindow.id),
    )) as unknown as FakeWindow;

    gameWindow.destroy();

    expect(environment.destroyed).toBe(true);
    expect(logger.destroyed).toBe(true);
  });

  it("lets hidden-on-close children close while quitting", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow,
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

  it("destroys and unregisters windows when renderer loading fails", async () => {
    const harness = createHarness();
    const gameWindow = (await run(
      harness.service.openGameWindow,
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
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;
    destroyedGame.destroy();

    const child = (await run(
      harness.service.openWindow(WindowIds.Environment),
    )) as unknown as FakeWindow;

    expect(child.options.parent).not.toBe(destroyedGame);
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

  it("uses Linux did-finish-load as a reveal fallback", async () => {
    const harness = createHarness("linux");

    const gameWindow = (await run(
      harness.service.openGameWindow,
    )) as unknown as FakeWindow;

    expect(gameWindow.visible).toBe(true);
  });
});
