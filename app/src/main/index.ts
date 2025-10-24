import "core-js/stable";
import "./tray";

import { join } from "path";
import process from "process";
import Config from "@vexed/config";
import { registerIpcMain } from "@vexed/tipc/main";
import { app, shell } from "electron";
import log from "electron-log";
import { version } from "../../package.json";
import {
  BRAND,
  DEFAULT_SETTINGS,
  DOCUMENTS_PATH,
  IS_MAC,
  IS_WINDOWS,
} from "../shared/constants";
import type { Settings } from "../shared/types";
import { ASSET_PATH, logger } from "./constants";
import { router } from "./tipc";
import { checkForUpdates } from "./updater";
import { createNotification } from "./util/notification";
import { showErrorDialog } from "./util/showErrorDialog";
import { createAccountManager, createGame, setQuitting } from "./windows";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

log.initialize({
  rendererTransports: ['console']
});

function registerFlashPlugin() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const flashTrust = require("nw-flash-trust");

  let pluginName;

  if (IS_WINDOWS) {
    pluginName = "pepflashplayer.dll";
  } else if (IS_MAC) {
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

    const level = settings.get("debug", false) ? "debug" : "info";

    log.transports.file.resolvePathFn = () => join(DOCUMENTS_PATH, "log.txt");
    log.transports.file.format = "[{datetime}]{scope} {text}";
    log.transports.console.format = "[{datetime}]{scope} {text}";
    log.transports.file.level = level;
    log.transports.console.level = level;

    logger.info(`hello - ${BRAND} v${version}`); // indicate app start

    if (settings?.get("checkForUpdates", false) === true) {
      const updateResult = await checkForUpdates(true);
      if (updateResult !== null) {
        logger.info(
          `update available - ${updateResult.newVersion} (current: ${version})`,
        );

        const notif = createNotification(
          "Update available",
          `Version ${updateResult.newVersion} is available. Click to view.`,
        );
        notif.once("click", async () =>
          shell.openExternal(updateResult.releaseUrl),
        );
      }
    }

    let launchMode = settings.get("launchMode", "game")?.toLowerCase();
    if (launchMode !== "manager" && launchMode !== "game") {
      launchMode = "game";
      logger.info(`unknown launch mode. got ${launchMode}, expected "game" or "manager".`);
    } else {
      logger.info(`launch mode: ${launchMode}`);
    }

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
    logger.error("failed to initialize the application");
    logger.error(err);

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

app.on("window-all-closed", () => {
  logger.info('bye!');
  app.quit();
});
