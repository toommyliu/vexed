import "./tray";

import { join } from "path";
import process from "process";
import Config from "@vexed/config";
import { registerIpcMain } from "@vexed/tipc/main";
import { app, shell } from "electron";
import { BRAND, DEFAULT_SETTINGS, DOCUMENTS_PATH } from "../shared/constants";
import type { Settings } from "../shared/types";
import { ASSET_PATH } from "./constants";
import { router } from "./tipc";
import { checkForUpdates } from "./updater";
import { createNotification } from "./util/notification";
import { showErrorDialog } from "./util/showErrorDialog";
import { createAccountManager, createGame, setQuitting } from "./windows";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

function registerFlashPlugin() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const flashTrust = require("nw-flash-trust");

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
    join(ASSET_PATH, pluginName),
  );

  const flashPath = join(
    app.getPath("userData"),
    "Pepper Data",
    "Shockwave Flash",
    "WritableRoot",
  );

  const trustManager = flashTrust.initSync(BRAND, flashPath);
  trustManager.empty();

  trustManager.add(join(ASSET_PATH, "loader.swf"));
}

async function handleAppLaunch(argv: string[] = process.argv) {
  try {
    const settings = new Config<Settings>({
      configName: "settings",
      cwd: DOCUMENTS_PATH,
      defaults: DEFAULT_SETTINGS,
    });
    await settings.load();

    if (settings?.get("checkForUpdates") === true) {
      const hasUpdate = await checkForUpdates(true);
      if (hasUpdate) {
        const notif = createNotification(
          "Update available",
          `Version ${hasUpdate.newVersion} is available. Click to view.`,
        );
        notif.once("click", async () => {
          await shell.openExternal(hasUpdate.releaseUrl);
        });
      }
    }

    const launchMode = settings.get("launchMode", "game")?.toLowerCase();
    if (
      launchMode === "manager" ||
      argv.some((arg) => arg === "--manager" || arg === "-m")
    ) {
      await createAccountManager();
    } else if (
      launchMode === "game" ||
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
