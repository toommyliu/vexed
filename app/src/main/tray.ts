import { join, sep } from "path";
import {
  deleteFile,
  pathExists,
  readDirRecursive,
  deleteDirectory,
} from "@vexed/fs-utils";
import { Menu, Tray, app, dialog, nativeImage, session } from "electron";
import { BRAND, IS_MAC } from "../shared/constants";
import { ASSET_PATH } from "./constants";
import { showErrorDialog } from "./util/dialog";
import { createAccountManager, createGame } from "./windows";

// https://www.electronjs.org/docs/latest/faq#my-apps-tray-disappeared-after-a-few-minutes
let tray: Tray | null = null;

const _deleteDirectory = async (dirPath: string) => {
  if (!(await pathExists(dirPath))) {
    console.log(`Directory does not exist: ${dirPath}`);
    return;
  }

  try {
    const dirs = new Set<string>();
    const files = new Set<string>();

    await readDirRecursive(dirPath, {
      filter: (_, absPath, stats) => {
        if (stats.isFile()) files.add(absPath);
        else if (stats.isDirectory()) dirs.add(absPath);
        return true;
      },
    });

    // Delete files first
    for (const filePath of files) await deleteFile(filePath);

    // Sort the directories by depth (a.k.a deepest path first)
    const sortedDirs = Array.from(dirs).sort(
      (a, b) => b.split(sep).length - a.split(sep).length,
    );
    for (const dir of sortedDirs) await deleteDirectory(dir);

    await deleteDirectory(dirPath);
  } catch {
    showErrorDialog({
      message: "Failed to clear Flash cache",
    });
  }
};

const contextMenu = Menu.buildFromTemplate([
  {
    label: "Open Account Manager",
    click: () => void createAccountManager(),
  },
  {
    label: "Open Game",
    click: () => void createGame(),
  },
  { type: "separator" },
  {
    label: "Clear App Cache",
    click: () => {
      session.defaultSession?.clearStorageData({
        storages: ["cookies", "appcache"],
      });
    },
  },
  {
    label: "Clear Flash Cache",
    click: async () => {
      const flashPath = join(
        app.getPath("userData"),
        "Pepper Data",
        "Shockwave Flash",
        "WritableRoot",
      );

      await _deleteDirectory(flashPath);

      // A restart is required because we'd have to re-register the flash plugin
      // So having the user restart the app is the easiest way to handle this.

      await dialog.showMessageBox({
        message:
          "Flash cache cleared successfully. An app restart is required.",
        type: "info",
      });
    },
  },
  { type: "separator" },
  {
    label: "Quit",
    click: () => {
      app.exit();
    },
  },
]);

app.on("ready", () => {
  // menu bar on mac, tray icon on windows
  const path = join(ASSET_PATH, "tray.png");
  const icon = nativeImage.createFromPath(path);

  tray = new Tray(icon);
  tray.setToolTip(BRAND);
  tray.setContextMenu(contextMenu);

  if (IS_MAC)
    app.dock.setIcon(nativeImage.createFromPath(join(ASSET_PATH, "icon.png")));
});

app.on("before-quit", () => {
  if (tray) {
    tray.destroy();
    tray = null;
  }
});
