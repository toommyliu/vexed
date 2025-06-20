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
import {
  createAccountManager,
  createGame,
  setQuitting,
  destroyManagerWindow,
} from "./windows";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

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

async function handleAppLaunch(argv: string[] = process.argv) {
  try {
    await FileManager.initialize();

    const settings = await FileManager.readJson<Settings>(
      FileManager.settingsPath,
    );

    if (
      settings?.launchMode?.toLowerCase() === "manager" ||
      argv.some((arg) => arg === "--manager" || arg === "-m")
    ) {
      await createAccountManager();
    } else if (
      settings?.launchMode?.toLowerCase() === "game" ||
      argv.some((arg) => arg === "--game" || arg === "-g")
    ) {
      const account = {
        username:
          argv.find((arg) => arg.startsWith("--username="))?.split("=")?.[1] ??
          "",
        password:
          argv.find((arg) => arg.startsWith("--password="))?.split("=")?.[1] ??
          "",
        server:
          argv.find((arg) => arg.startsWith("--server="))?.split("=")[1] ?? "",
        scriptPath:
          argv
            .find((arg) => arg.startsWith("--scriptPath="))
            ?.split("=")?.[1] ?? "",
      };

      await createGame(account);
    }
  } catch (error) {
    const err = error as Error;
    showErrorDialog({
      error: err,
      message: "Failed to initialize the application.",
    });
  }
}

registerFlashPlugin();
registerIpcMain(router);

const gotTheLock = app.requestSingleInstanceLock();
if (gotTheLock) {
  // Main instance: handle second instance attempts
  app.on("second-instance", async (_ev, argv, _workingDirectory) =>
    handleAppLaunch(argv),
  );
} else {
  // Another instance: don't do anything and immediately exit
  app.exit();
}

app.once("ready", async () => handleAppLaunch());

app.on("before-quit", () => {
  setQuitting(true);
  destroyManagerWindow();
});

app.on("window-all-closed", () => app.quit());
