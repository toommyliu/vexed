import "abort-controller/polyfill";
import { unwatchFile, watchFile, type Stats } from "fs";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeTheme,
  session,
  type OpenDialogOptions,
} from "electron";
import { join } from "path";
import process from "process";
import { homedir } from "os";
import { Effect, Layer } from "effect";
import appBranding from "../../appBranding.json";
import { createAppearanceSnapshot } from "../shared/appearance-snapshot";
import { ScriptingIpcChannels, type ScriptExecutePayload } from "../shared/ipc";
import { WindowIds } from "../shared/windows";
import { registerAccountManagerIpcHandlers } from "./account-manager-ipc";
import { registerArmyIpcHandlers } from "./army-ipc";
import {
  getArtixLauncherRequestHeaders,
  getArtixLauncherUserAgent,
} from "./artix-launcher-headers";
import { registerCombatProfilesIpcHandlers } from "./combat-profiles-ipc";
import { createApplicationMenu } from "./menu";
import { registerEnvironmentIpcHandlers } from "./environment-ipc";
import { registerFollowerIpcHandlers } from "./follower-ipc";
import { registerPacketsIpcHandlers } from "./packets-ipc";
import * as Appearance from "./settings/Appearance";
import * as Files from "./settings/Files";
import * as Preferences from "./settings/Preferences";
import { getScriptsPath, updateCachedScriptPayload } from "./scripting";
import { registerSettingsIpcHandlers } from "./settings-ipc";
import {
  installNativeThemeChangeBroadcast,
  syncNativeTheme,
} from "./settings-service";
import { registerWindowIpcHandlers } from "./window-ipc";
import {
  getRendererGameWindowPath,
  getRendererWindowPath,
  makeElectronWindowRuntime,
  makeWindowService,
  WindowManagerError,
  WindowService,
  type WindowManagerConfig,
  type WindowServiceShape,
  type WindowEffectRunner,
} from "./windows";

const flash = require("nw-flash-trust");

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const isDevApp = !app.isPackaged;
const isDarwin = process.platform === "darwin";
const isWin = process.platform === "win32";
const isLinux = process.platform === "linux";
const activeBranding = isDevApp ? appBranding.dev : appBranding.production;

const resolveAppDataBasePath = (): string =>
  isWin
    ? process.env["APPDATA"] || join(homedir(), "AppData", "Roaming")
    : isDarwin
      ? join(homedir(), "Library", "Application Support")
      : process.env["XDG_CONFIG_HOME"] || join(homedir(), ".config");

const resolveUserDataPath = (): string =>
  join(resolveAppDataBasePath(), activeBranding.userDataDirName);

app.setPath("userData", resolveUserDataPath());
Files.configureAppDataHome(app.getPath("userData"));
app.setName(activeBranding.displayName);

if (isWin) {
  app.setAppUserModelId(activeBranding.bundleId);
}

const assetsPath = join(app.getAppPath(), "..", "assets");
const rendererPath = join(__dirname, "../renderer");
const workspacePath = Files.resolveWorkspaceHome({
  argv: process.argv,
  documentsPath: app.getPath("documents"),
});
Files.configureWorkspaceHome(workspacePath);
const devRendererReloadPath = process.env["VEXED_DEV_RENDERER_RELOAD"];
const devRendererUrl = process.env["VEXED_DEV_RENDERER_URL"];

const flashPath = join(
  app.getPath("userData"),
  "Pepper Data",
  "Shockwave Flash",
  "WritableRoot",
);

const flashPluginPath = isDarwin
  ? Files.workspaceJoin("PepperFlashPlayer.plugin")
  : isWin
    ? Files.workspaceJoin("pepflashplayer.dll")
    : isLinux
      ? Files.workspaceJoin("libpepflashplayer.so")
      : null;

if (flashPluginPath) {
  app.commandLine.appendSwitch("ppapi-flash-path", flashPluginPath);
}

const trustManager = flash.initSync("vexed", flashPath);
trustManager.empty();

trustManager.add(join(assetsPath, "loader.swf"));

const getEventWindow = (senderId?: number): BrowserWindow | null => {
  if (senderId !== undefined) {
    for (const win of BrowserWindow.getAllWindows()) {
      if (win.webContents.id === senderId) {
        return win;
      }
    }
  }

  const focused = BrowserWindow.getFocusedWindow();
  if (focused) {
    return focused;
  }

  const [first] = BrowserWindow.getAllWindows();
  return first ?? null;
};

const openScriptDialog = async (
  win: BrowserWindow | null,
): Promise<ScriptExecutePayload | null> => {
  const options: OpenDialogOptions = {
    title: "Open script",
    defaultPath: getScriptsPath(),
    filters: [
      { name: "JavaScript", extensions: ["js", "cjs"] },
      { name: "All Files", extensions: ["*"] },
    ],
    properties: ["openFile"],
  };

  const result =
    win === null
      ? await dialog.showOpenDialog(options)
      : await dialog.showOpenDialog(win, options);

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const [path] = result.filePaths;
  if (!path) {
    return null;
  }

  return await updateCachedScriptPayload(path);
};

let scriptingIpcRegistered = false;

const registerScriptingIpcHandlers = () => {
  if (scriptingIpcRegistered) {
    return;
  }

  ipcMain.handle(ScriptingIpcChannels.openFile, async (event) => {
    const win = getEventWindow(event.sender.id);
    return await openScriptDialog(win);
  });

  ipcMain.handle(
    ScriptingIpcChannels.readFile,
    async (_event, path: unknown) => {
      if (typeof path !== "string" || path.trim() === "") {
        throw new Error("Invalid script path");
      }

      return await updateCachedScriptPayload(path.trim());
    },
  );

  scriptingIpcRegistered = true;
};

const gameUserAgent = getArtixLauncherUserAgent();

const configureGameWindow = (win: BrowserWindow): void => {
  win.webContents.setUserAgent(gameUserAgent);
};

const installGameRequestHeaders = (): void => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = details.requestHeaders;
    for (const [name, value] of Object.entries(
      getArtixLauncherRequestHeaders(),
    )) {
      Object.defineProperty(requestHeaders, name, { value });
    }
    callback({ requestHeaders, cancel: false });
  });
};

const installDevRendererReloadWatcher = () => {
  if (!devRendererReloadPath) {
    return;
  }

  const listener = (current: Stats, previous: Stats) => {
    if (
      current.mtimeMs === previous.mtimeMs &&
      current.size === previous.size
    ) {
      return;
    }

    if (current.mtimeMs === 0) {
      return;
    }

    for (const win of BrowserWindow.getAllWindows()) {
      if (!win.isDestroyed() && !win.webContents.isDestroyed()) {
        win.webContents.reloadIgnoringCache();
      }
    }
  };

  watchFile(devRendererReloadPath, { interval: 250 }, listener);
  app.once("will-quit", () => unwatchFile(devRendererReloadPath, listener));
};

const installDevDockIcon = () => {
  if (!isDevApp || !isDarwin) {
    return;
  }

  app.dock.setIcon(join(assetsPath, activeBranding.iconPng));
};

const resolveDevRendererUrl = (): string | null => {
  if (!isDevApp || !devRendererUrl) {
    return null;
  }

  try {
    const url = new URL(devRendererUrl);
    const isLoopback =
      url.protocol === "http:" &&
      (url.hostname === "127.0.0.1" || url.hostname === "localhost");

    return isLoopback ? url.toString() : null;
  } catch {
    return null;
  }
};

let runWindowEffect: WindowEffectRunner | null = null;
let configuredWindowService: WindowServiceShape | null = null;

const runConfiguredWindowEffect: WindowEffectRunner = (effect) => {
  if (!runWindowEffect) {
    return Promise.reject(
      new WindowManagerError({
        message: "Window service has not been configured",
      }),
    );
  }

  return runWindowEffect(effect);
};

const markConfiguredWindowServiceQuitting = (): void => {
  if (!configuredWindowService) {
    throw new WindowManagerError({
      message: "Window service has not been configured",
    });
  }

  Effect.runSync(configuredWindowService.setQuitting(true));
};

const openStartupWindow = (launchMode: Preferences.AppLaunchMode): void => {
  if (launchMode === "game") {
    void runConfiguredWindowEffect(
      Effect.gen(function* () {
        const windows = yield* WindowService;
        yield* windows.revealGameWindow;
      }),
    ).catch((error) => {
      console.error("Failed to reveal game window:", error);
    });
    return;
  }

  void runConfiguredWindowEffect(
    Effect.gen(function* () {
      const windows = yield* WindowService;
      yield* windows.openWindow(WindowIds.AccountManager);
    }),
  ).catch((error) => {
    console.error("Failed to open startup window:", error);
  });
};

const loadMainSettings = () => {
  const preferences = Preferences.ensure();
  const appearance = Appearance.ensure();
  syncNativeTheme(appearance);
  return { appearance, preferences };
};

const revealStartupWindow = (): void => {
  const preferences = Preferences.read();
  openStartupWindow(preferences.launchMode);
};

app.whenReady().then(() => {
  const { preferences } = loadMainSettings();
  const windowServiceConfig: WindowManagerConfig = {
    gameWindowHtmlPath: getRendererGameWindowPath(rendererPath),
    isDev: isDevApp,
    preloadPath: join(__dirname, "../preload/index.js"),
    rendererUrl: resolveDevRendererUrl(),
    windowHtmlPath: (id) => getRendererWindowPath(rendererPath, id),
    getAppearanceSnapshot: () =>
      createAppearanceSnapshot(
        Appearance.read(),
        nativeTheme.shouldUseDarkColors,
      ),
    onGameWindowCreated: configureGameWindow,
  };
  const windowService = makeWindowService(
    windowServiceConfig,
    makeElectronWindowRuntime(),
  );
  const windowLayer = Layer.succeed(WindowService, windowService);

  configuredWindowService = windowService;

  runWindowEffect = <A>(
    effect: Effect.Effect<A, WindowManagerError, WindowService>,
  ): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(windowLayer)));

  registerScriptingIpcHandlers();
  registerArmyIpcHandlers();
  registerAccountManagerIpcHandlers(runConfiguredWindowEffect);
  registerCombatProfilesIpcHandlers();
  registerEnvironmentIpcHandlers(runConfiguredWindowEffect);
  registerFollowerIpcHandlers(runConfiguredWindowEffect);
  registerPacketsIpcHandlers(runConfiguredWindowEffect);
  registerSettingsIpcHandlers();
  registerWindowIpcHandlers(runConfiguredWindowEffect);
  installNativeThemeChangeBroadcast();
  installGameRequestHeaders();
  installDevRendererReloadWatcher();
  installDevDockIcon();
  createApplicationMenu(runConfiguredWindowEffect);
  openStartupWindow(preferences.launchMode);
});

app.on("before-quit", () => {
  try {
    markConfiguredWindowServiceQuitting();
  } catch (error) {
    console.error("Failed to mark window service as quitting:", error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    revealStartupWindow();
  }
});
