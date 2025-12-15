import "core-js/stable";
import "./tray";

import { join } from "path";
import process from "process";
import { registerIpcMain } from "@vexed/tipc/main";
import { app, shell, nativeTheme } from "electron";
import log from "electron-log";
import { version } from "../../package.json";
import {
  BRAND,
  DOCUMENTS_PATH,
  IS_MAC,
  IS_WINDOWS,
} from "../shared/constants";
import { equalsIgnoreCase } from "../shared/string";
import { ASSET_PATH, logger } from "./constants";
import { createMenu } from "./menu";
import { initSettings, getSettings } from "./settings";
import { router } from "./tipc";
import { checkForUpdates } from "./updater";
import { showErrorDialog } from "./util/dialog";
import { createNotification } from "./util/notification";
import { createAccountManager, createGame, setQuitting } from "./windows";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

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
    showErrorDialog(
      {
        message: "Unsupported platform.",
      },
      true,
    );
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
    const settings = getSettings();

    const level = settings.getBoolean("debug", false) ? "debug" : "info";

    log.initialize({
      rendererTransports: ["console", level === "debug" && "file"],
    });
    log.scope.labelPadding = false;
    log.transports.file.resolvePathFn = () => join(DOCUMENTS_PATH, "log.txt");
    log.transports.file.format = "[{datetime}] ({level}){scope} {text}";
    log.transports.console.format = "[{datetime}] ({level}){scope} {text}";
    log.transports.file.level = level;
    log.transports.console.level = level;

    logger.info(`Hello - ${BRAND} v${version}`); // indicate app start

    if (settings?.getBoolean("checkForUpdates", false)) {
      const updateResult = await checkForUpdates(true);
      if (updateResult !== null) {
        logger.info(
          `Update available - ${updateResult.newVersion} (current: ${version})`,
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

    let launchMode = settings.getString("launchMode", "game");
    if (!equalsIgnoreCase(launchMode, "manager") && !equalsIgnoreCase(launchMode, "game")) {
      logger.info(
        `Unknown launch mode, got "${launchMode}", defaulting to "game"...`,
      );
      launchMode = "game";
    } else {
      logger.info(`Using launch mode: ${launchMode}`);
    }

    if (
      equalsIgnoreCase(launchMode, "manager") ||
      argv.some((arg) => equalsIgnoreCase(arg, "--manager") || equalsIgnoreCase(arg, "-m"))
    ) {
      await createAccountManager();
    } else if (
      equalsIgnoreCase(launchMode, "game") ||
      argv.some((arg) => equalsIgnoreCase(arg, "--game") || equalsIgnoreCase(arg, "-g"))
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
    showErrorDialog({
      error: error as Error,
      message: "Failed to initialize the application.",
    });
  }
}

registerFlashPlugin();
registerIpcMain(router);

if (IS_WINDOWS) {
  app.setAppUserModelId(BRAND);
}

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

app.once("ready", async () => {
  const settings = await initSettings();

  nativeTheme.themeSource = settings.get("theme") ?? "system";

  createMenu(settings);
  await handleAppLaunch();
});

app.on("before-quit", () => {
  setQuitting(true);
});

app.on("window-all-closed", () => {
  logger.info("Bye!");
  app.quit();
});
