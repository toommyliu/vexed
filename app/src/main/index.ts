import "./tray";

import { join } from "path";
import process from "process";
import Config from "@vexed/config";
import { registerIpcMain } from "@vexed/tipc/main";
import { app } from "electron";
import { BRAND, DOCUMENTS_PATH } from "../shared/constants";
import type { Settings } from "../shared/types";
import { ASSET_PATH } from "./constants";
import { router } from "./tipc";
import { showErrorDialog } from "./util/showErrorDialog";
import { createAccountManager, createGame, setQuitting } from "./windows";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function registerFlashPlugin() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const flashTrust = require("nw-flash-trust");
  // TODO: add checks for app.isPackaged

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

  console.log(`flash plugin path: ${join(ASSET_PATH, pluginName)}`);

  app.commandLine.appendSwitch(
    "ppapi-flash-path",
    join(ASSET_PATH, pluginName),
  );

  const flashPath = join(
    app.getPath("userData"),
    "Pepper Data",
    "Shockwave Flash",
    "WritableRoot",
  );

  console.log(`flash path: ${flashPath}`);

  const trustManager = flashTrust.initSync(BRAND, flashPath);
  trustManager.empty();

  console.log(`trusted path: ${join(ASSET_PATH, pluginName)}`);

  trustManager.add(join(ASSET_PATH, "loader.swf"));
}

async function handleAppLaunch(argv: string[] = process.argv) {
  try {
    const settings = new Config<Settings>({
      configName: "settings",
      cwd: DOCUMENTS_PATH,
    });
    await settings.load();

    if (
      settings.get("launchMode")?.toLowerCase() === "manager" ||
      argv.some((arg) => arg === "--manager" || arg === "-m")
    ) {
      await createAccountManager();
    } else if (
      settings.get("launchMode")?.toLowerCase() === "game" ||
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
});

app.on("window-all-closed", () => app.quit());
