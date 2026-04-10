import { promises } from "fs";
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  session,
  type OpenDialogOptions,
} from "electron";
import { basename, join } from "path";
import process from "process";
const ScriptingIpcChannels = {
  execute: "scripting:execute",
  stop: "scripting:stop",
  openFile: "scripting:open-file",
  readFile: "scripting:read-file",
} as const;

interface ScriptExecutePayload {
  readonly source: string;
  readonly path?: string;
  readonly name?: string;
}

const { readFile } = promises;

const flash = require("nw-flash-trust");

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const assetsPath = join(app.getAppPath(), "..", "assets");
const documentsPath = join(app.getPath("documents"), "vexed");
const scriptsPath = join(documentsPath, "scripts");

const flashPath = join(
  app.getPath("userData"),
  "Pepper Data",
  "Shockwave Flash",
  "WritableRoot",
);

const isMac = process.platform === "darwin";
const isWin = process.platform === "win32";
const isLinux = process.platform === "linux";

const flashPluginPath = isMac
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

const toScriptPayload = async (
  path: string,
): Promise<ScriptExecutePayload> => ({
  source: await readFile(path, "utf8"),
  path,
  name: basename(path),
});

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

      return await toScriptPayload(path);
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
    const hasPrimaryModifier =
      process.platform === "darwin" ? input.meta : input.control;

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      plugins: true,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  bindScriptingShortcuts(win);

  win.webContents.openDevTools({ mode: "right" });

  const userAgent = isMac
    ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
    : isLinux
      ? "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";

  win.webContents.setUserAgent(userAgent);
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = details.requestHeaders;
    Object.defineProperty(requestHeaders, "User-Agent", { value: userAgent });
    Object.defineProperty(requestHeaders, "artixmode", { value: "launcher " });
    Object.defineProperty(requestHeaders, "X-Requested-With", {
      value: "ShockwaveFlash/32.0.0.371",
    });
    callback({ requestHeaders, cancel: false });
  });

  win
    .loadFile(join(__dirname, "../renderer/game/index.html"))
    .catch((err) => console.error("Failed to load renderer HTML:", err));
}

app.whenReady().then(() => {
  registerScriptingIpcHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
