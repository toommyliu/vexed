import "core-js/stable";
import "./tray";

import { join } from "path";
import process from "process";
import { existsSync } from "fs";
import { registerIpcMain } from "@vexed/tipc/main";
import { equalsIgnoreCase } from "@vexed/utils/string";
import { app, shell, nativeTheme } from "electron";

import { version } from "../../package.json";
import { getArgValue, hasArgFlag } from "../shared/argv";
import { BRAND, IS_MAC, IS_WINDOWS, IS_LINUX, getAssetPath } from "./constants";
import { createMenu } from "./menu";
import { initFlashService } from "./services/flash";
import {
  initMainLogger,
  createLogger,
  setLoggerDebug,
} from "./services/logger";
import { updaterService } from "./services/updater";
import { windowsService } from "./services/windows";
import { initSettings, getSettings } from "./settings";
import { router } from "./tipc";
import { showErrorDialog } from "./util/dialog";
import { createNotification } from "./util/notification";
import { DOCUMENTS_PATH } from "./constants";

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

if (IS_LINUX) {
  app.commandLine.appendSwitch("no-sandbox");
}

const logger = createLogger("app");

async function registerFlashPlugin() {
  let pluginName;
  let basePath = getAssetPath();
  if (IS_WINDOWS) {
    pluginName = "pepflashplayer.dll";
  } else if (IS_MAC) {
    pluginName = "PepperFlashPlayer.plugin";
  } else if (IS_LINUX) {
    basePath = DOCUMENTS_PATH;
    pluginName = "libpepflashplayer.so";
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

  const finalPath = join(basePath, pluginName);
  // this must be synchronous so it blocks and registers in time
  // eslint-disable-next-line n/no-sync
  if (!existsSync(finalPath)) {
    showErrorDialog(
      {
        message: `Flash plugin not found. Expected: "${finalPath}"`,
      },
      true,
    );
    return;
  }

  app.commandLine.appendSwitch("ppapi-flash-path", finalPath);
  // todo: this should be part of FlashService
  const flashPath = join(
    app.getPath("userData"),
    "Pepper Data",
    "Shockwave Flash",
    "WritableRoot",
  );
  const result = await initFlashService(BRAND, flashPath);
  if (result.isOk()) {
    const trustManager = result.value;
    await trustManager.empty();
    await trustManager.add(join(getAssetPath(), "loader.swf"));
  } else {
    logger.error("Failed to initialize Flash trust manager", result.error);
  }
}

async function handleAppLaunch(argv: string[] = process.argv) {
  try {
    const settings = getSettings();

    setLoggerDebug(settings.getBoolean("debug", false));
    await initMainLogger();

    logger.info(`Hello - ${BRAND} v${version}`); // indicate app start

    if (settings?.getBoolean("checkForUpdates", false)) {
      const updateResult = await updaterService.run(true);
      if (updateResult !== null) {
        const notif = createNotification(
          "Update available",
          `Version ${updateResult.newVersion} is available. Click to view.`,
        );
        notif.once("click", async () =>
          shell.openExternal(updateResult.releaseUrl),
        );
      }
    }

    const isManagerFlag = hasArgFlag(argv, "--manager", "-m");
    const isGameFlag = hasArgFlag(argv, "--game", "-g");

    let launchMode = settings.getString("launchMode", "game");

    if (isManagerFlag) {
      launchMode = "manager";
    } else if (isGameFlag) {
      launchMode = "game";
    }

    const isManagerMode = equalsIgnoreCase(launchMode, "manager");
    const isGameMode = equalsIgnoreCase(launchMode, "game");

    if (!isManagerMode && !isGameMode) {
      logger.warn(
        `Unknown launch mode, got "${launchMode}", defaulting to "game"...`,
      );
      launchMode = "game";
    }

    logger.info(`Using launch mode: ${launchMode}`);

    if (isManagerMode) {
      windowsService.manager();
    } else if (isGameMode) {
      const account = {
        username: getArgValue(argv, "--username=") ?? "",
        password: getArgValue(argv, "--password=") ?? "",
        server: getArgValue(argv, "--server=") ?? "",
        scriptPath: getArgValue(argv, "--scriptPath=") ?? "",
      };

      windowsService.game(account);
    }
  } catch (error) {
    logger.error(error);
    showErrorDialog({
      error: error as Error,
      message: "Failed to initialize the application.",
    });
  }
}

registerFlashPlugin().catch((error) => {
  logger.error("Failed to register Flash trust", error);
});

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

app.on("before-quit", async (ev) => {
  if (windowsService.isQuitting) return;
  ev.preventDefault();
  windowsService.setQuitting(true);
  app.quit();
});

app.on("window-all-closed", () => {
  app.quit();
});
