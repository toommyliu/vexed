import "abort-controller/polyfill";
import { existsSync, promises, unwatchFile, watchFile, type Stats } from "fs";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  session,
  type OpenDialogOptions,
} from "electron";
import { basename, join, sep } from "path";
import process from "process";
import { homedir } from "os";
import { Effect } from "effect";
import appBranding from "../../appBranding.json";
import { ScriptingIpcChannels, type ScriptExecutePayload } from "../shared/ipc";
import { WindowIds } from "../shared/windows";
import { createApplicationMenu } from "./menu";
import * as Appearance from "./settings/Appearance";
import * as Preferences from "./settings/Preferences";
import { registerSettingsIpcHandlers } from "./settings-ipc";
import {
  installNativeThemeChangeBroadcast,
  syncNativeTheme,
} from "./settings-service";
import { registerWindowIpcHandlers } from "./window-ipc";
import {
  getRendererGameWindowPath,
  getRendererWindowPath,
  WindowManagerError,
  WindowService,
  WindowServiceLive,
  type WindowEffectRunner,
} from "./windows";

const { mkdir, readFile, realpath } = promises;

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

const resolveUserDataPath = (): string => {
  const appDataBase = resolveAppDataBasePath();

  // If the legacy directory exists, prefer that over the new one to avoid losing session data.
  for (const dirName of activeBranding.legacyUserDataDirNames) {
    const legacyPath = join(appDataBase, dirName);
    if (existsSync(legacyPath)) {
      return legacyPath;
    }
  }

  return join(appDataBase, activeBranding.userDataDirName);
};

app.setPath("userData", resolveUserDataPath());
app.setName(activeBranding.displayName);

if (isWin) {
  app.setAppUserModelId(activeBranding.bundleId);
}

const assetsPath = join(app.getAppPath(), "..", "assets");
const rendererPath = join(__dirname, "../renderer");
const documentsPath = join(app.getPath("documents"), "vexed");
const scriptsPath = join(documentsPath, "scripts");
const devRendererReloadPath = process.env["VEXED_DEV_RENDERER_RELOAD"];
const devRendererUrl = process.env["VEXED_DEV_RENDERER_URL"];

const flashPath = join(
  app.getPath("userData"),
  "Pepper Data",
  "Shockwave Flash",
  "WritableRoot",
);

const flashPluginPath = isDarwin
  ? join(documentsPath, "PepperFlashPlayer.plugin")
  : isWin
    ? join(documentsPath, "pepflashplayer.dll")
    : isLinux
      ? join(documentsPath, "libpepflashplayer.so")
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

const resolveScriptPath = async (path: string): Promise<string> => {
  await mkdir(scriptsPath, { recursive: true });

  const [scriptsRoot, scriptPath] = await Promise.all([
    realpath(scriptsPath),
    realpath(path),
  ]);

  if (
    scriptPath !== scriptsRoot &&
    !scriptPath.startsWith(`${scriptsRoot}${sep}`)
  ) {
    throw new Error("Script path must be inside the scripts directory");
  }

  return scriptPath;
};

const toScriptPayload = async (path: string): Promise<ScriptExecutePayload> => {
  const scriptPath = await resolveScriptPath(path);

  return {
    source: await readFile(scriptPath, "utf8"),
    path: scriptPath,
    name: basename(scriptPath),
  };
};

const openScriptDialog = async (
  win: BrowserWindow | null,
): Promise<ScriptExecutePayload | null> => {
  const options: OpenDialogOptions = {
    title: "Open script",
    defaultPath: scriptsPath,
    filters: [
      { name: "JavaScript", extensions: ["js", "mjs", "cjs", "ts"] },
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

  return await toScriptPayload(path);
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

      return await toScriptPayload(path.trim());
    },
  );

  scriptingIpcRegistered = true;
};

const openScriptAndSendToRenderer = async (win: BrowserWindow) => {
  const payload = await openScriptDialog(win);
  if (!payload) {
    return;
  }

  win.webContents.send(ScriptingIpcChannels.execute, payload);
};

const stopActiveScript = (win: BrowserWindow) => {
  win.webContents.send(ScriptingIpcChannels.stop);
};

const bindScriptingShortcuts = (win: BrowserWindow) => {
  win.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") {
      return;
    }

    const key = input.key.toLowerCase();
    const hasPrimaryModifier = isDarwin ? input.meta : input.control;

    if (hasPrimaryModifier && key === "o") {
      event.preventDefault();
      void openScriptAndSendToRenderer(win);
      return;
    }

    if (hasPrimaryModifier && input.shift && key === "x") {
      event.preventDefault();
      stopActiveScript(win);
    }
  });
};

const getGameUserAgent = (): string =>
  isDarwin
    ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
    : isLinux
      ? "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";

const gameUserAgent = getGameUserAgent();

const configureGameWindow = (win: BrowserWindow): void => {
  bindScriptingShortcuts(win);
  win.webContents.setUserAgent(gameUserAgent);
};

const installGameRequestHeaders = (): void => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = details.requestHeaders;
    Object.defineProperty(requestHeaders, "User-Agent", {
      value: gameUserAgent,
    });
    Object.defineProperty(requestHeaders, "artixmode", { value: "launcher" });
    Object.defineProperty(requestHeaders, "X-Requested-With", {
      value: "ShockwaveFlash/32.0.0.371",
    });
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

const openGameWindow = (): void => {
  void runConfiguredWindowEffect(
    Effect.gen(function* () {
      const windows = yield* WindowService;
      return yield* windows.openGameWindow;
    }),
  ).catch((error) => {
    console.error("Failed to open game window:", error);
  });
};

const openStartupWindow = (launchMode: Preferences.AppLaunchMode): void => {
  if (launchMode === "game") {
    openGameWindow();
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

app.whenReady().then(() => {
  const { preferences } = loadMainSettings();
  const windowLayer = WindowServiceLive({
    gameWindowHtmlPath: getRendererGameWindowPath(rendererPath),
    isDev: isDevApp,
    preloadPath: join(__dirname, "../preload/index.js"),
    rendererUrl: resolveDevRendererUrl(),
    windowHtmlPath: (id) => getRendererWindowPath(rendererPath, id),
    onGameWindowCreated: configureGameWindow,
  });

  runWindowEffect = <A>(
    effect: Effect.Effect<A, WindowManagerError, WindowService>,
  ): Promise<A> => Effect.runPromise(effect.pipe(Effect.provide(windowLayer)));

  registerScriptingIpcHandlers();
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
  void runConfiguredWindowEffect(
    Effect.gen(function* () {
      const windows = yield* WindowService;
      yield* windows.setQuitting(true);
    }),
  ).catch((error) => {
    console.error("Failed to mark window service as quitting:", error);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  const preferences = Preferences.read();
  openStartupWindow(preferences.launchMode);
});
