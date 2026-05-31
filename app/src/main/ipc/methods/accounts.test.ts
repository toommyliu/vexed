import { EventEmitter } from "events";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { BrowserWindow, BrowserWindowConstructorOptions } from "electron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Effect, Layer } from "effect";
import { createAppearanceSnapshot } from "../../../shared/appearance-snapshot";
import {
  AccountManagerIpcChannels,
  type AccountGameLaunchPayload,
} from "../../../shared/ipc";
import { DEFAULT_APPEARANCE } from "../../../shared/settings";
import type { AccountManagerRepositoryShape } from "../../persistence/accounts/AccountRepository";
import type { AccountManagerStorage } from "../../persistence/accounts/AccountStore";
import {
  makeWindowService,
  WindowService,
  type ElectronWindowRuntime,
  type WindowEffectRunner,
  type WindowManagerConfig,
} from "../../window/WindowService";
import type { WorkspaceFilesShape } from "../../workspace/WorkspaceFiles";
import { startAccountGameLaunch } from "./accounts";

class FakeWebContents extends EventEmitter {
  public readonly sent: {
    readonly channel: string;
    readonly args: readonly unknown[];
  }[] = [];

  public isDestroyed(): boolean {
    return false;
  }

  public send(channel: string, ...args: readonly unknown[]): void {
    this.sent.push({ channel, args });
  }
}

class FakeWindow extends EventEmitter {
  public readonly webContents = new FakeWebContents();
  public visible = false;
  public destroyed = false;

  public constructor(
    public readonly id: number,
    public readonly options: BrowserWindowConstructorOptions,
  ) {
    super();
  }

  public async loadFile(): Promise<void> {}

  public async loadURL(): Promise<void> {}

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public isMinimized(): boolean {
    return false;
  }

  public restore(): void {}

  public show(): void {
    this.visible = true;
  }

  public focus(): void {
    this.emit("focus");
  }

  public destroy(): void {
    this.destroyed = true;
    this.emit("closed");
  }
}

let tempDir: string | undefined;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "vexed-account-launch-"));
});

afterEach(async () => {
  if (tempDir !== undefined) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

const makeRepository = (): AccountManagerRepositoryShape => {
  const storage: AccountManagerStorage = { accounts: [], groups: {} };
  return {
    storagePath: "/tmp/accounts.json",
    get: Effect.succeed(storage),
    set: (next) => Effect.succeed(next),
    update: (f) => Effect.succeed(f(storage)),
    toState: (sessions) =>
      Effect.succeed({
        accounts: storage.accounts,
        groups: storage.groups,
        sessions,
        storagePath: "/tmp/accounts.json",
      }),
  };
};

const makeWorkspace = (scriptsDir: string): WorkspaceFilesShape => ({
  scriptsDir,
  flashPluginPath: null,
  readScript: () => Effect.die("not used"),
  readArmyConfig: () => Effect.die("not used"),
});

const makeHarness = (): {
  readonly runWindowEffect: WindowEffectRunner;
  readonly windows: readonly FakeWindow[];
} => {
  const windows: FakeWindow[] = [];
  let nextId = 1;
  const config: WindowManagerConfig = {
    gameWindowHtmlPath: "/renderer/game/index.html",
    isDev: false,
    preloadPath: "/preload.js",
    windowHtmlPath: (id) => `/renderer/${id}/index.html`,
    getAppearanceSnapshot: () =>
      createAppearanceSnapshot(DEFAULT_APPEARANCE, true),
  };
  const runtime: ElectronWindowRuntime = {
    platform: "darwin",
    createWindow: (options) => {
      const window = new FakeWindow(nextId++, options);
      windows.push(window);
      return window as unknown as BrowserWindow;
    },
    fromId: (id) =>
      (windows.find((window) => window.id === id) ??
        null) as unknown as BrowserWindow | null,
    getAllWindows: () => windows as unknown as BrowserWindow[],
    getFocusedWindow: () => null,
    getCenteredPosition: () => ({ x: 0, y: 0 }),
    focusApp: () => {},
  };
  const service = makeWindowService(config, runtime);
  const layer = Layer.succeed(WindowService, service);

  return {
    runWindowEffect: (effect) =>
      Effect.runPromise(effect.pipe(Effect.provide(layer))),
    windows,
  };
};

describe("account game launch", () => {
  it("delivers the same refreshed launch payload shape the game renderer consumes", async () => {
    if (tempDir === undefined) {
      throw new Error("Missing temp directory");
    }

    const scriptsDir = join(tempDir, "scripts");
    const scriptPath = join(scriptsDir, "farm.js");
    await mkdir(scriptsDir, { recursive: true });
    await writeFile(scriptPath, "module.exports = 'fresh';\n", "utf8");
    const harness = makeHarness();

    const result = await startAccountGameLaunch(
      {
        account: {
          label: "Hero",
          username: "Hero",
          password: "secret",
        },
        server: "Yorumi",
        script: {
          source: "module.exports = 'stale';\n",
          path: scriptPath,
          name: "farm.js",
        },
      },
      {
        runWindowEffect: harness.runWindowEffect,
        repository: makeRepository(),
        workspace: makeWorkspace(scriptsDir),
        observability: {
          error: vi.fn(() => Effect.succeed({} as never)),
        },
      },
    );

    const [gameWindow] = harness.windows;
    if (gameWindow === undefined) {
      throw new Error("Missing game window");
    }

    const sentLaunch = gameWindow.webContents.sent.find(
      (message) => message.channel === AccountManagerIpcChannels.gameLaunch,
    );
    const payload = sentLaunch?.args[0] as AccountGameLaunchPayload | undefined;

    expect(result.gameWindowId).toBe(gameWindow.id);
    expect(payload).toMatchObject({
      account: {
        label: "Hero",
        username: "Hero",
        password: "secret",
      },
      gameWindowId: gameWindow.id,
      server: "Yorumi",
      script: {
        source: "module.exports = 'fresh';\n",
        name: "farm.js",
      },
    });
    gameWindow.destroy();
  });
});
