import "./tray";

import { join } from "path";
import process from "process";
import { registerIpcMain } from "@egoist/tipc/main";
import { app } from "electron";
import { FileManager } from "../shared/FileManager";
import { BRAND } from "../shared/constants";
import type { Settings } from "../shared/types";
import { router } from "./tipc";
import { showErrorDialog } from "./util/showErrorDialog";
import { createAccountManager, createGame } from "./windows";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

registerIpcMain(router);

function registerFlashPlugin() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const flashTrust = require("nw-flash-trust");
  // TODO: add checks for app.isPackaged
  const assetsPath = join(__dirname, "../../assets");
  let pluginName;

  if (process.platform === "win32") {
    pluginName = "pepflashplayer.dll";
  } else if (process.platform === "darwin") {
    pluginName = "PepperFlashPlayer.plugin";
  }

  if (!pluginName) {
    showErrorDialog({ message: "Unsupported platform." });
    return;
  }

  app.commandLine.appendSwitch(
    "ppapi-flash-path",
    join(assetsPath, pluginName),
  );

  const flashPath = join(
    app.getPath("userData"),
    "Pepper Data",
    "Shockwave Flash",
    "WritableRoot",
  );

  const trustManager = flashTrust.initSync(BRAND, flashPath);
  trustManager.empty();
  trustManager.add(join(assetsPath, "loader.swf"));
}

registerFlashPlugin();

// app.commandLine.appendSwitch('disable-renderer-backgrounding');
// app.commandLine.appendArgument('--disable-renderer-backgrounding');

app.once("ready", async () => {
  try {
    await FileManager.initialize();

    const settings = await FileManager.readJson<Settings>(
      FileManager.settingsPath,
    );

    if (settings?.launchMode?.toLowerCase() === "manager") {
      await createAccountManager();
    } else {
      await createGame();
    }
  } catch (error) {
    const err = error as Error;
    showErrorDialog({
      error: err,
      message: "Failed to initialize the application.",
    });
  }
});

app.on("window-all-closed", () => app.exit());
