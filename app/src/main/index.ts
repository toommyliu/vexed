import { app, BrowserWindow, session } from "electron";
import { join } from "path";
import process from "process";

const flash = require("nw-flash-trust");

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

const assetsPath = join(app.getAppPath(), "..", "assets");
const documentsPath = join(app.getPath("documents"), "vexed");

const flashPath = join(
  app.getPath("userData"),
  "Pepper Data",
  "Shockwave Flash",
  "WritableRoot",
);

const flashPluginPath =
  process.platform === "darwin"
    ? join(documentsPath, "PepperFlashPlayer.plugin")
    : process.platform === "win32"
      ? join(documentsPath, "pepflashplayer.dll")
      : process.platform === "linux"
        ? join(documentsPath, "libpepflashplayer.so")
        : null;

if (flashPluginPath) {
  app.commandLine.appendSwitch("ppapi-flash-path", flashPluginPath);
}

const trustManager = flash.initSync("vexed", flashPath);
trustManager.empty();

trustManager.add(join(assetsPath, "loader.swf"));

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      plugins: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.webContents.openDevTools({ mode: "right" });

  const userAgent =
    process.platform === "darwin"
      ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16_0) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
      : process.platform === "linux"
        ? "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) ArtixGameLauncher/2.2.0 Chrome/80.0.3987.163 Electron/8.5.5 Safari/537.36";

  win.webContents.setUserAgent(userAgent);
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const requestHeaders = details.requestHeaders;
    Object.defineProperty(requestHeaders, "User-Agent", { value: userAgent });
    Object.defineProperty(requestHeaders, "artixmode", { value: "launcher" });
    Object.defineProperty(requestHeaders, "X-Requested-With", {
      value: "ShockwaveFlash/32.0.0.371",
    });
    callback({ requestHeaders, cancel: false });
  });

  win
    .loadFile(join(__dirname, "../renderer/game/index.html"))
    .catch((err) => console.error("Failed to load renderer HTML:", err));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
