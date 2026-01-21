import "core-js/stable";
import "./tray";

import { join } from "path";
import process from "process";
import { registerIpcMain } from "@vexed/tipc/main";
import { equalsIgnoreCase } from "@vexed/utils/string";
import { app, shell, nativeTheme } from "electron";
import { version } from "../../package.json";
import { IS_MAC, IS_WINDOWS } from "../shared/constants";
import { ASSET_PATH, BRAND } from "./constants";
import { createMenu } from "./menu";
import {
  flushAndCloseLogger,
  initMainLogger,
  logger,
  setLoggerDebugEnabled,
} from "./services/logger";
import { updaterService } from "./services/updater";
import { windowsService } from "./services/windows";
import { initSettings, getSettings } from "./settings";
import { router } from "./tipc";
import { showErrorDialog } from "./util/dialog";
import { createNotification } from "./util/notification";

console.log("app.getVersion", app.getVersion());
console.log("app.name", app.name);

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
  console.log("flash path :: ", flashPath);
  const trustManager = flashTrust.initSync(BRAND, flashPath);
  trustManager.empty();

  trustManager.add(join(ASSET_PATH, "loader.swf"));
}

async function handleAppLaunch(argv: string[] = process.argv) {
  console.log(await updaterService.run(true));

  try {
    const settings = getSettings();

    setLoggerDebugEnabled(settings.getBoolean("debug", false));
    await initMainLogger();

    logger.info("main", `Hello - ${BRAND} v${version}`); // indicate app start

    if (settings?.getBoolean("checkForUpdates", false)) {
      const updateResult = await updaterService.run(true);
      if (updateResult !== null) {
        logger.info(
          "main",
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

    const parseArgValue = (prefix: string) =>
      argv.find((arg) => arg.startsWith(prefix))?.split("=")[1] ?? "";
    const hasFlag = (...flags: string[]) =>
      argv.some((arg) => flags.some((flag) => equalsIgnoreCase(arg, flag)));

    const isManagerMode =
      equalsIgnoreCase(launchMode, "manager") || hasFlag("--manager", "-m");
    const isGameMode =
      equalsIgnoreCase(launchMode, "game") || hasFlag("--game", "-g");

    if (!isManagerMode && !isGameMode) {
      logger.info(
        "main",
        `Unknown launch mode, got "${launchMode}", defaulting to "game"...`,
      );
      launchMode = "game";
    } else {
      logger.info("main", `Using launch mode: ${launchMode}`);
    }

    if (isManagerMode) {
      windowsService.manager();
    } else if (isGameMode) {
      const account = {
        username: parseArgValue("--username="),
        password: parseArgValue("--password="),
        server: parseArgValue("--server="),
        scriptPath: parseArgValue("--scriptPath="),
      };
      windowsService.game(account);
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

let loggerClosing = false;

app.on("before-quit", async (ev) => {
  if (loggerClosing) return;

  ev.preventDefault();
  loggerClosing = true;
  windowsService.setQuitting(true);

  await Promise.race([
    flushAndCloseLogger(),
    new Promise<void>((resolve) => {
      globalThis.setTimeout(resolve, 2_000);
    }),
  ]);

  app.quit();
});

app.on("window-all-closed", () => {
  logger.info("Bye!");
  app.quit();
});
