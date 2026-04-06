import { app, BrowserWindow } from "electron";
import { join } from "path";

const flash = require("nw-flash-trust");

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
      nodeIntegration: true,
      contextIsolation: false,
    },
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
